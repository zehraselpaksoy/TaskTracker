using System.Text;
using System.Text.Json;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using TaskTracker.Contracts.Events;
using TaskTracker.NotificationService.Connections;
using TaskTracker.NotificationService.Services;

namespace TaskTracker.NotificationService.Messaging;

public sealed class TeamMemberAddedConsumer : BackgroundService
{
    private const string QueueName = "team-member-added-queue";

    private readonly RabbitMqConnection _rabbitMqConnection;
    private readonly ILogger<TeamMemberAddedConsumer> _logger;
    private readonly IDeviceTokenProvider _deviceTokenProvider;
    private readonly IFirebaseNotificationService _firebaseNotificationService;

    private IModel? _channel;

    public TeamMemberAddedConsumer(
        RabbitMqConnection rabbitMqConnection,
        ILogger<TeamMemberAddedConsumer> logger,
        IDeviceTokenProvider deviceTokenProvider,
        IFirebaseNotificationService firebaseNotificationService)
    {
        _rabbitMqConnection = rabbitMqConnection;
        _logger = logger;
        _deviceTokenProvider = deviceTokenProvider;
        _firebaseNotificationService = firebaseNotificationService;
    }

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        _channel = _rabbitMqConnection.CreateChannel();

        _channel.QueueDeclare(
            queue: QueueName,
            durable: true,
            exclusive: false,
            autoDelete: false,
            arguments: null);

        _channel.BasicQos(
            prefetchSize: 0,
            prefetchCount: 1,
            global: false);

        var consumer = new AsyncEventingBasicConsumer(_channel);

        consumer.Received += async (_, eventArgs) =>
        {
            try
            {
                var json = Encoding.UTF8.GetString(
                    eventArgs.Body.ToArray());

                var memberAddedEvent =
                    JsonSerializer.Deserialize<TeamMemberAddedEvent>(json);

                if (memberAddedEvent is null)
                {
                    _channel.BasicNack(
                        deliveryTag: eventArgs.DeliveryTag,
                        multiple: false,
                        requeue: false);

                    return;
                }

                _logger.LogInformation(
                    "Takım üyeliği bildirimi alındı. " +
                    "TeamId: {TeamId}, Takım: {TeamName}, " +
                    "Eklenen kullanıcı: {AddedUserId}, " +
                    "Ekleyen: {AddedByUserName}",
                    memberAddedEvent.TeamId,
                    memberAddedEvent.TeamName,
                    memberAddedEvent.AddedUserId,
                    memberAddedEvent.AddedByUserName);

                var deviceTokens =
                    await _deviceTokenProvider.GetTokensAsync(
                        new[] { memberAddedEvent.AddedUserId },
                        stoppingToken);

                if (deviceTokens.Count == 0)
                {
                    _logger.LogWarning(
                        "Takıma eklenen kullanıcının kayıtlı cihaz tokenı " +
                        "bulunamadı. UserId: {UserId}",
                        memberAddedEvent.AddedUserId);
                }
                else
                {
                    foreach (var deviceToken in deviceTokens)
                    {
                        await _firebaseNotificationService.SendAsync(
                            deviceToken: deviceToken,
                            title: "Yeni bir takıma eklendiniz",
                            body:
                                $"{memberAddedEvent.AddedByUserName}, " +
                                $"sizi \"{memberAddedEvent.TeamName}\" " +
                                "takımına ekledi.",
                            data: new Dictionary<string, string>
                            {
                                ["type"] = "teamMemberAdded",
                                ["teamId"] =
                                    memberAddedEvent.TeamId.ToString()
                            },
                            cancellationToken: stoppingToken);
                    }

                    _logger.LogInformation(
                        "Takım üyeliği bildirimi {DeviceCount} cihaza gönderildi.",
                        deviceTokens.Count);
                }

                // Firebase işlemi tamamlandıktan sonra mesajı onayla.
                _channel.BasicAck(
                    deliveryTag: eventArgs.DeliveryTag,
                    multiple: false);
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "Takım üyeliği mesajı işlenirken hata oluştu.");

                _channel?.BasicNack(
                    deliveryTag: eventArgs.DeliveryTag,
                    multiple: false,
                    requeue: false);
            }
        };

        _channel.BasicConsume(
            queue: QueueName,
            autoAck: false,
            consumer: consumer);

        _logger.LogInformation(
            "{QueueName} kuyruğu dinleniyor.",
            QueueName);

        await Task.Delay(
            Timeout.Infinite,
            stoppingToken);
    }

    public override void Dispose()
    {
        _channel?.Close();
        _channel?.Dispose();

        base.Dispose();
    }
}