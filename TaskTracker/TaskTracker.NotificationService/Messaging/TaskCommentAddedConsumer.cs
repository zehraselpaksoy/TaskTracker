using System.Text;
using System.Text.Json;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using TaskTracker.Contracts.Events;
using TaskTracker.NotificationService.Connections;

namespace TaskTracker.NotificationService.Messaging;

public sealed class TaskCommentAddedConsumer : BackgroundService
{
    private const string QueueName = "task-comment-added-queue";

    private readonly RabbitMqConnection _rabbitMqConnection;
    private readonly ILogger<TaskCommentAddedConsumer> _logger;

    private IModel? _channel;

    public TaskCommentAddedConsumer(
        RabbitMqConnection rabbitMqConnection,
        ILogger<TaskCommentAddedConsumer> logger)
    {
        _rabbitMqConnection = rabbitMqConnection;
        _logger = logger;
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

                _channel.BasicAck(
                    deliveryTag: eventArgs.DeliveryTag,
                    multiple: false);

                await Task.CompletedTask;
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