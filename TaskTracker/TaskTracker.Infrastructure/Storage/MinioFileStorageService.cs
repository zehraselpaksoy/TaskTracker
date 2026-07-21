using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Minio;
using Minio.DataModel.Args;
using Minio.Exceptions;
using TaskTracker.Application.Interfaces.Storage;

namespace TaskTracker.Infrastructure.Storage;

public sealed class MinioFileStorageService : IFileStorageService
{
    private const long MaximumFileSize = 20 * 1024 * 1024; // 20 MB
    private const int MaximumPresignedUrlExpirySeconds = 7 * 24 * 60 * 60;

    private static readonly SemaphoreSlim BucketLock = new(1, 1);

    private readonly IMinioClient _minioClient;
    private readonly MinioSettings _settings;

    private bool _bucketInitialized;

    public MinioFileStorageService(
        IMinioClient minioClient,
        IOptions<MinioSettings> options)
    {
        _minioClient = minioClient;
        _settings = options.Value;

        ValidateSettings();
    }

    public async Task<string> UploadFileAsync(
        IFormFile file,
        CancellationToken cancellationToken = default)
    {
        ValidateFile(file);

        await EnsureBucketExistsAsync(cancellationToken);

        var objectName = GenerateObjectName(file.FileName);

        await using var fileStream = file.OpenReadStream();

        var putObjectArgs = new PutObjectArgs()
            .WithBucket(_settings.BucketName)
            .WithObject(objectName)
            .WithStreamData(fileStream)
            .WithObjectSize(file.Length)
            .WithContentType(GetContentType(file));

        await _minioClient.PutObjectAsync(
            putObjectArgs,
            cancellationToken);

        return objectName;
    }

    public async Task DeleteFileAsync(
        string objectName,
        CancellationToken cancellationToken = default)
    {
        ValidateObjectName(objectName);

        await EnsureBucketExistsAsync(cancellationToken);

        var removeObjectArgs = new RemoveObjectArgs()
            .WithBucket(_settings.BucketName)
            .WithObject(objectName);

        await _minioClient.RemoveObjectAsync(
            removeObjectArgs,
            cancellationToken);
    }

    public async Task<string> GetFileUrlAsync(
        string objectName,
        int expiryInMinutes = 60)
    {
        ValidateObjectName(objectName);

        if (expiryInMinutes <= 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(expiryInMinutes),
                "URL geçerlilik süresi sıfırdan büyük olmalıdır.");
        }

        var expiryInSeconds = checked(expiryInMinutes * 60);

        if (expiryInSeconds > MaximumPresignedUrlExpirySeconds)
        {
            throw new ArgumentOutOfRangeException(
                nameof(expiryInMinutes),
                "İmzalı URL geçerlilik süresi en fazla 7 gün olabilir.");
        }

        await EnsureBucketExistsAsync(CancellationToken.None);

        var presignedGetObjectArgs = new PresignedGetObjectArgs()
            .WithBucket(_settings.BucketName)
            .WithObject(objectName)
            .WithExpiry(expiryInSeconds);

        return await _minioClient.PresignedGetObjectAsync(
            presignedGetObjectArgs);
    }

    public async Task<bool> FileExistsAsync(
        string objectName,
        CancellationToken cancellationToken = default)
    {
        ValidateObjectName(objectName);

        await EnsureBucketExistsAsync(cancellationToken);

        var statObjectArgs = new StatObjectArgs()
            .WithBucket(_settings.BucketName)
            .WithObject(objectName);

        try
        {
            await _minioClient.StatObjectAsync(
                statObjectArgs,
                cancellationToken);

            return true;
        }
        catch (ObjectNotFoundException)
        {
            return false;
        }
    }

    private async Task EnsureBucketExistsAsync(
        CancellationToken cancellationToken)
    {
        if (_bucketInitialized)
        {
            return;
        }

        await BucketLock.WaitAsync(cancellationToken);

        try
        {
            if (_bucketInitialized)
            {
                return;
            }

            var bucketExistsArgs = new BucketExistsArgs()
                .WithBucket(_settings.BucketName);

            var bucketExists = await _minioClient.BucketExistsAsync(
                bucketExistsArgs,
                cancellationToken);

            if (!bucketExists)
            {
                var makeBucketArgs = new MakeBucketArgs()
                    .WithBucket(_settings.BucketName);

                await _minioClient.MakeBucketAsync(
                    makeBucketArgs,
                    cancellationToken);
            }

            _bucketInitialized = true;
        }
        finally
        {
            BucketLock.Release();
        }
    }

    private static string GenerateObjectName(string originalFileName)
    {
        var extension = Path
            .GetExtension(originalFileName)
            .ToLowerInvariant();

        var datePath = DateTime.UtcNow.ToString("yyyy/MM");

        return $"comments/{datePath}/{Guid.NewGuid():N}{extension}";
    }

    private static string GetContentType(IFormFile file)
    {
        return string.IsNullOrWhiteSpace(file.ContentType)
            ? "application/octet-stream"
            : file.ContentType;
    }

    private static void ValidateFile(IFormFile? file)
    {
        if (file is null)
        {
            throw new ArgumentNullException(
                nameof(file),
                "Yüklenecek dosya bulunamadı.");
        }

        if (file.Length <= 0)
        {
            throw new ArgumentException(
                "Boş dosya yüklenemez.",
                nameof(file));
        }

        if (file.Length > MaximumFileSize)
        {
            throw new ArgumentException(
                "Dosya boyutu en fazla 20 MB olabilir.",
                nameof(file));
        }

        if (string.IsNullOrWhiteSpace(file.FileName))
        {
            throw new ArgumentException(
                "Dosya adı bulunamadı.",
                nameof(file));
        }
    }

    private static void ValidateObjectName(string objectName)
    {
        if (string.IsNullOrWhiteSpace(objectName))
        {
            throw new ArgumentException(
                "MinIO nesne adı boş olamaz.",
                nameof(objectName));
        }
    }

    private void ValidateSettings()
    {
        if (string.IsNullOrWhiteSpace(_settings.Endpoint))
        {
            throw new InvalidOperationException(
                "Minio:Endpoint yapılandırması bulunamadı.");
        }

        if (string.IsNullOrWhiteSpace(_settings.AccessKey))
        {
            throw new InvalidOperationException(
                "Minio:AccessKey yapılandırması bulunamadı.");
        }

        if (string.IsNullOrWhiteSpace(_settings.SecretKey))
        {
            throw new InvalidOperationException(
                "Minio:SecretKey yapılandırması bulunamadı.");
        }

        if (string.IsNullOrWhiteSpace(_settings.BucketName))
        {
            throw new InvalidOperationException(
                "Minio:BucketName yapılandırması bulunamadı.");
        }
    }
}