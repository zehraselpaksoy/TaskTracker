using System.Text;
using System.Text.Json;
using RabbitMQ.Client;
using TaskTracker.Application.Interfaces.Messaging;

namespace TaskTracker.Infrastructure.RabbitMq;

public sealed class RabbitMqPublisher : IRabbitMqPublisher, IDisposable
{
    private readonly IConnection _connection;

    public RabbitMqPublisher()
    {
        var factory = new ConnectionFactory
        {
            HostName = "localhost",
            UserName = "admin",
            Password = "admin123"
        };

        _connection = factory.CreateConnection();
    }

    public Task PublishAsync<T>(
        string queueName,
        T message,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        using var channel = _connection.CreateModel();

        channel.QueueDeclare(
            queue: queueName,
            durable: true,
            exclusive: false,
            autoDelete: false,
            arguments: null);

        var jsonMessage = JsonSerializer.Serialize(message);
        var messageBody = Encoding.UTF8.GetBytes(jsonMessage);

        var properties = channel.CreateBasicProperties();

        properties.Persistent = true;
        properties.ContentType = "application/json";
        properties.ContentEncoding = "utf-8";

        channel.BasicPublish(
            exchange: string.Empty,
            routingKey: queueName,
            basicProperties: properties,
            body: messageBody);

        return Task.CompletedTask;
    }

    public void Dispose()
    {
        if (_connection.IsOpen)
        {
            _connection.Close();
        }

        _connection.Dispose();
    }
}