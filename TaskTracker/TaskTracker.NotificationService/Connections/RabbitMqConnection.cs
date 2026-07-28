using RabbitMQ.Client;

namespace TaskTracker.NotificationService.Connections;

public sealed class RabbitMqConnection : IDisposable
{
    private readonly IConnection _connection;

    public RabbitMqConnection()
    {
        var factory = new ConnectionFactory
        {
            HostName = "localhost",
            UserName = "admin",
            Password = "admin123",
            DispatchConsumersAsync = true
        };

        _connection = factory.CreateConnection();
    }

    public IModel CreateChannel()
    {
        return _connection.CreateModel();
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