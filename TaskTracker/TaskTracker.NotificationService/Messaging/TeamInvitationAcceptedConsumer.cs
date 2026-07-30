using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using TaskTracker.Contracts;
using TaskTracker.Contracts.Events;
using TaskTracker.NotificationService.Connections;
using TaskTracker.NotificationService.Services;

namespace TaskTracker.NotificationService.Messaging;

public sealed class TeamInvitationAcceptedConsumer
    : BackgroundService
{
    private const string QueueName =
        "team-invitation-accepted-queue";

    private readonly RabbitMqConnection
        _rabbitMqConnection;

    private readonly ILogger<TeamInvitationAcceptedConsumer>
        _logger;

    private readonly IDeviceTokenProvider
        _deviceTokenProvider;

    private readonly IFirebaseNotificationService
        _firebaseNotificationService;

    private IModel? _channel;

    public TeamInvitationAcceptedConsumer(
        RabbitMqConnection rabbitMqConnection,
        ILogger<TeamInvitationAcceptedConsumer> logger,
        IDeviceTokenProvider deviceTokenProvider,
        IFirebaseNotificationService firebaseNotificationService)
    {
        _rabbitMqConnection = rabbitMqConnection;
        _logger = logger;
        _deviceTokenProvider = deviceTokenProvider;
        _firebaseNotificationService =
            firebaseNotificationService;
    }

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        _channel =
            _rabbitMqConnection.CreateChannel();

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

        var consumer =
            new AsyncEventingBasicConsumer(_channel);

        consumer.Received += async (_, eventArgs) =>
        {
            try
            {
                var json = Encoding.UTF8.GetString(
                    eventArgs.Body.ToArray());

                var acceptedEvent =
                    JsonSerializer.Deserialize<
                        TeamInvitationAcceptedEvent>(json);

                if (acceptedEvent is null)
                {
                    _channel.BasicNack(
                        eventArgs.DeliveryTag,
                        multiple: false,
                        requeue: false);

                    return;
                }

                _logger.LogInformation(
                    "Takım daveti kabul edildi. " +
                    "TeamId: {TeamId}, Lider: {LeaderUserId}, " +
                    "Katılan kullanıcı: {AcceptedByUserName}",
                    acceptedEvent.TeamId,
                    acceptedEvent.LeaderUserId,
                    acceptedEvent.AcceptedByUserName);

                var deviceTokens =
                    await _deviceTokenProvider.GetTokensAsync(
                        [acceptedEvent.LeaderUserId],
                        stoppingToken);

                foreach (var deviceToken in deviceTokens)
                {
                    await _firebaseNotificationService.SendAsync(
                        deviceToken: deviceToken,
                        title: "Takım daveti kabul edildi",
                        body:
                            $"{acceptedEvent.AcceptedByUserName}, " +
                            $"\"{acceptedEvent.TeamName}\" takımına katıldı.",
                        data: new Dictionary<string, string>
                        {
                            ["type"] =
                                "teamInvitationAccepted",

                            ["teamId"] =
                                acceptedEvent.TeamId.ToString()
                        },
                        cancellationToken: stoppingToken);
                }

                _logger.LogInformation(
                    "Davet kabul bildirimi {DeviceCount} " +
                    "cihaza gönderildi.",
                    deviceTokens.Count);

                _channel.BasicAck(
                    eventArgs.DeliveryTag,
                    multiple: false);
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "Davet kabul mesajı işlenirken hata oluştu.");

                _channel?.BasicNack(
                    eventArgs.DeliveryTag,
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