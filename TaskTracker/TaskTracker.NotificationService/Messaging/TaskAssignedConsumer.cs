using System.Text;
using System.Text.Json;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using TaskTracker.Contracts.Events;
using TaskTracker.NotificationService.Connections;
using TaskTracker.NotificationService.Services;

namespace TaskTracker.NotificationService.Messaging;

public sealed class TaskAssignedConsumer : BackgroundService
{
    private const string QueueName = "task-assigned-queue";

    private readonly RabbitMqConnection _rabbitMqConnection;
    private readonly ILogger<TaskAssignedConsumer> _logger;
    private readonly IDeviceTokenProvider _deviceTokenProvider;
    private readonly IFirebaseNotificationService
        _firebaseNotificationService;

    private IModel? _channel;

    public TaskAssignedConsumer(
        RabbitMqConnection rabbitMqConnection,
        ILogger<TaskAssignedConsumer> logger,
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

                var taskAssignedEvent =
                    JsonSerializer.Deserialize<TaskAssignedEvent>(
                        json);

                if (taskAssignedEvent is null)
                {
                    _channel.BasicNack(
                        deliveryTag: eventArgs.DeliveryTag,
                        multiple: false,
                        requeue: false);

                    return;
                }

                _logger.LogInformation(
                    "Görev atama mesajı alındı. " +
                    "TaskId: {TaskId}, UserId: {UserId}, " +
                    "Başlık: {Title}",
                    taskAssignedEvent.TaskId,
                    taskAssignedEvent.AssignedUserId,
                    taskAssignedEvent.TaskTitle);

                var deviceTokens =
                    await _deviceTokenProvider.GetTokensAsync(
                        [taskAssignedEvent.AssignedUserId],
                        stoppingToken);

                if (deviceTokens.Count == 0)
                {
                    _logger.LogWarning(
                        "Kullanıcının kayıtlı cihaz tokenı bulunamadı. " +
                        "UserId: {UserId}",
                        taskAssignedEvent.AssignedUserId);
                }
                else
                {
                    foreach (var deviceToken in deviceTokens)
                    {
                        await _firebaseNotificationService.SendAsync(
                            deviceToken: deviceToken,
                            title: "Yeni görev atandı",
                            body:
                                $"{taskAssignedEvent.AssignedByUserName} " +
                                $"size \"{taskAssignedEvent.TaskTitle}\" " +
                                "görevini atadı.",
                            data: new Dictionary<string, string>
                            {
                                ["type"] = "taskAssigned",
                                ["taskId"] =
                                    taskAssignedEvent.TaskId.ToString()
                            },
                            cancellationToken: stoppingToken);
                    }

                    _logger.LogInformation(
                        "Görev atama bildirimi {DeviceCount} " +
                        "cihaza gönderildi.",
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
                    "Görev atama mesajı işlenirken hata oluştu.");

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