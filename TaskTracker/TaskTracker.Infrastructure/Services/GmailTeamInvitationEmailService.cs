using System.Net;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;
using TaskTracker.Application.Interfaces.Services;

namespace TaskTracker.Infrastructure.Services;

public sealed class GmailTeamInvitationEmailService
    : ITeamInvitationEmailService
{
    private readonly IConfiguration _configuration;

    public GmailTeamInvitationEmailService(
        IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendInvitationAsync(
        string recipientEmail,
        string teamName,
        string invitedByUserName,
        string invitationLink,
        CancellationToken cancellationToken = default)
    {
        var senderEmail =
            _configuration["Gmail:SmtpEmail"];

        var appPassword =
            Environment.GetEnvironmentVariable(
                "GMAIL_APP_PASSWORD");

        if (string.IsNullOrWhiteSpace(senderEmail))
        {
            throw new InvalidOperationException(
                "Gmail:SmtpEmail tanımlanmamış.");
        }

        if (string.IsNullOrWhiteSpace(appPassword))
        {
            throw new InvalidOperationException(
                "GMAIL_APP_PASSWORD ortam değişkeni bulunamadı.");
        }

        var safeTeamName =
            WebUtility.HtmlEncode(teamName);

        var safeInvitedBy =
            WebUtility.HtmlEncode(invitedByUserName);

        var safeLink =
            WebUtility.HtmlEncode(invitationLink);

        var message = new MimeMessage();

        message.From.Add(
            new MailboxAddress(
                "TaskTracker",
                senderEmail));

        message.To.Add(
            MailboxAddress.Parse(recipientEmail));

        message.Subject =
            $"{teamName} takımına davet edildiniz";

        message.Body = new TextPart("html")
        {
            Text = $"""
                <h2>Takım daveti</h2>
                <p>
                    <strong>{safeInvitedBy}</strong>,
                    sizi <strong>{safeTeamName}</strong>
                    takımına davet etti.
                </p>
                <p>
                    <a href="{safeLink}">
                        Daveti görüntüle
                    </a>
                </p>
                <p>Bu bağlantı 7 gün boyunca geçerlidir.</p>
                """
        };

        using var smtpClient = new SmtpClient();

        await smtpClient.ConnectAsync(
            "smtp.gmail.com",
            465,
            SecureSocketOptions.SslOnConnect,
            cancellationToken);

        await smtpClient.AuthenticateAsync(
            senderEmail,
            appPassword,
            cancellationToken);

        await smtpClient.SendAsync(
            message,
            cancellationToken);

        await smtpClient.DisconnectAsync(
            true,
            cancellationToken);
    }
}