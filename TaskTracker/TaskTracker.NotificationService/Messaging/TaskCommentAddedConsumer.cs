using System.Text;
using System.Text.Json;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using TaskTracker.Contracts.Events;
using TaskTracker.NotificationService.Connections;
using TaskTracker.NotificationService.Services;

namespace TaskTracker.NotificationService.Messaging;

public sealed class TaskCommentAddedConsumer : BackgroundService
{
    private const string QueueName = "task-comment-added-queue";

    private readonly RabbitMqConnection _rabbitMqConnection;
    private readonly ILogger<TaskCommentAddedConsumer> _logger;
    private readonly IDeviceTokenProvider _deviceTokenProvider;
    private readonly IFirebaseNotificationService _firebaseNotificationService;

    private IModel? _channel;

    public TaskCommentAddedConsumer(
      RabbitMqConnection rabbitMqConnection,
      ILogger<TaskCommentAddedConsumer> logger,
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

                var commentAddedEvent =
                    JsonSerializer.Deserialize<TaskCommentAddedEvent>(json);

                if (commentAddedEvent is null)
                {
                    _channel.BasicNack(
                        deliveryTag: eventArgs.DeliveryTag,
                        multiple: false,
                        requeue: false);

                    return;
                }

                _logger.LogInformation(
                    "Yorum bildirimi alındı. " +
                    "TaskId: {TaskId}, Yorumu yapan: {CommentedBy}, " +
                    "Alıcılar: {Recipients}, Yorum: {Comment}",
                    commentAddedEvent.TaskId,
                    commentAddedEvent.CommentedByUserName,
                    string.Join(", ", commentAddedEvent.RecipientUserIds),
                    commentAddedEvent.CommentPreview);

                _logger.LogInformation(
     "Yorum bildirimi için cihaz tokenları sorgulanıyor.");

                var deviceTokens =
                    await _deviceTokenProvider.GetTokensAsync(
                        commentAddedEvent.RecipientUserIds,
                        stoppingToken);

                if (deviceTokens.Count == 0)
                {
                    _logger.LogWarning(
                        "Yorum bildirimi için kayıtlı cihaz tokenı bulunamadı. " +
                        "Alıcılar: {Recipients}",
                        string.Join(", ", commentAddedEvent.RecipientUserIds));
                }
                else
                {
                    foreach (var deviceToken in deviceTokens)
                    {
                        await _firebaseNotificationService.SendAsync(
                            deviceToken: deviceToken,
                            title: "Göreve yeni yorum",
                            body:
                                $"{commentAddedEvent.CommentedByUserName}, " +
                                $"\"{commentAddedEvent.TaskTitle}\" görevine " +
                                $"yorum ekledi: {commentAddedEvent.CommentPreview}",
                            data: new Dictionary<string, string>
                            {
                                ["type"] = "taskCommentAdded",
                                ["taskId"] = commentAddedEvent.TaskId.ToString()
                            },
                            cancellationToken: stoppingToken);
                    }

                    _logger.LogInformation(
                        "Yorum bildirimi {DeviceCount} cihaza gönderildi.",
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
                    "Yorum mesajı işlenirken hata oluştu.");

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