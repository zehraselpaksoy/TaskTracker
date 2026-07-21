using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TaskTracker.Application.Interfaces.Storage
{
    public interface IFileStorageService
    {
        Task<string> UploadFileAsync(IFormFile file, CancellationToken cancellationToken = default);

        Task DeleteFileAsync(string objectName, CancellationToken cancellationToken = default);

        Task<string> GetFileUrlAsync(string objectName, int expiryInMinutes = 60);

        Task<bool> FileExistsAsync(string objectName, CancellationToken cancellationToken = default);
    }
}
