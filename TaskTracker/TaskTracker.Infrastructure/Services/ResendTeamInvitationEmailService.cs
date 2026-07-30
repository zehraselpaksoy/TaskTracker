using System.Net;
using Microsoft.Extensions.Configuration;
using Resend;
using TaskTracker.Application.Interfaces.Services;

namespace TaskTracker.Infrastructure.Services;

public sealed class ResendTeamInvitationEmailService
    : ITeamInvitationEmailService
{
    private readonly IResend _resend;
    private readonly IConfiguration _configuration;

    public ResendTeamInvitationEmailService(
        IResend resend,
        IConfiguration configuration)
    {
        _resend = resend;
        _configuration = configuration;
    }

    public async Task SendInvitationAsync(
        string recipientEmail,
        string teamName,
        string invitedByUserName,
        string invitationLink,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var fromEmail = _configuration["Resend:FromEmail"];

        if (string.IsNullOrWhiteSpace(fromEmail))
        {
            throw new InvalidOperationException(
                "Resend gönderen e-posta adresi tanımlanmamış.");
        }

        var safeTeamName = WebUtility.HtmlEncode(teamName);
        var safeInvitedBy = WebUtility.HtmlEncode(invitedByUserName);
        var safeLink = WebUtility.HtmlEncode(invitationLink);

        var message = new EmailMessage
        {
            From = fromEmail,
            Subject = $"{teamName} takımına davet edildiniz",
            HtmlBody = $"""
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

        message.To.Add(recipientEmail);

        await _resend.EmailSendAsync(message);
    }
}