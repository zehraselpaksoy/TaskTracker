using Microsoft.Extensions.Configuration;
using TaskTracker.Application.Interfaces.Services;

namespace TaskTracker.Infrastructure.Services;

public sealed class TeamInvitationLinkService
    : ITeamInvitationLinkService
{
    private readonly IConfiguration _configuration;

    public TeamInvitationLinkService(
        IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string CreateInvitationLink(string token)
    {
        var baseUrl = _configuration[
            "TeamInvitation:BaseUrl"];

        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            throw new InvalidOperationException(
                "Takım daveti bağlantı adresi tanımlanmamış.");
        }

        var encodedToken =
            Uri.EscapeDataString(token);

        return
            $"{baseUrl.TrimEnd('/')}?token={encodedToken}";
    }
}