using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace TaskTracker.API.Hubs;

[Authorize]
public class TaskHub : Hub
{
    public async Task JoinTeamGroup(int teamId)
    {
        await Groups.AddToGroupAsync(
            Context.ConnectionId,
            GetTeamGroupName(teamId));
    }

    public async Task LeaveTeamGroup(int teamId)
    {
        await Groups.RemoveFromGroupAsync(
            Context.ConnectionId,
            GetTeamGroupName(teamId));
    }

    private static string GetTeamGroupName(int teamId)
    {
        return $"team-{teamId}";
    }
}