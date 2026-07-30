namespace TaskTracker.Application.Interfaces.Messaging;

public interface IRabbitMqPublisher
{
    Task PublishAsync<T>(string queueName,T message,CancellationToken cancellationToken = default);
}