using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using TaskTracker.API.Hubs;
using TaskTracker.API.Middleware;
using TaskTracker.Application;
using TaskTracker.Infrastructure;
using Resend;

var builder = WebApplication.CreateBuilder(args);

#region Service Registrations

// Application katmaný servisleri
builder.Services.AddApplicationServices();

// Infrastructure katmaný:
// DbContext, Repository, UnitOfWork, MinIO ve diðer altyapý servisleri
builder.Services.AddInfrastructureServices(builder.Configuration);

// Controller servisleri
builder.Services.AddControllers();

// SignalR servisleri
builder.Services.AddSignalR();

// JWT Authentication
builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme =
            JwtBearerDefaults.AuthenticationScheme;

        options.DefaultChallengeScheme =
            JwtBearerDefaults.AuthenticationScheme;

        options.DefaultScheme =
            JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        var jwtKey = builder.Configuration["Jwt:Key"]
                     ?? throw new InvalidOperationException(
                         "Jwt:Key yapýlandýrmasý bulunamadý.");

        var jwtIssuer = builder.Configuration["Jwt:Issuer"]
                        ?? throw new InvalidOperationException(
                            "Jwt:Issuer yapýlandýrmasý bulunamadý.");

        var jwtAudience = builder.Configuration["Jwt:Audience"]
                          ?? throw new InvalidOperationException(
                              "Jwt:Audience yapýlandýrmasý bulunamadý.");

        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();

        options.SaveToken = true;

        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,

                ValidIssuer = jwtIssuer,
                ValidAudience = jwtAudience,

                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(jwtKey)),

                ClockSkew = TimeSpan.Zero
            };

        // SignalR baðlantýsýnda JWT token query string üzerinden gelebilir.
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken =
                    context.Request.Query["access_token"].FirstOrDefault();

                var requestPath = context.HttpContext.Request.Path;

                if (!string.IsNullOrWhiteSpace(accessToken) &&
                    requestPath.StartsWithSegments("/hubs/task"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
    });

// Authorization
builder.Services.AddAuthorization();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowIonic", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:4200",
                "http://127.0.0.1:4200",
                "http://localhost:8100",
                "http://127.0.0.1:8100",
                "http://localhost",
                "https://localhost",
                "capacitor://localhost"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});
builder.Services.AddResend(options =>
{
    options.ApiToken =
        Environment.GetEnvironmentVariable("RESEND_APITOKEN")
        ?? throw new InvalidOperationException(
            "RESEND_APITOKEN ortam deðiþkeni bulunamadý.");
});
// Swagger
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc(
        "v1",
        new OpenApiInfo
        {
            Title = "TaskTracker API",
            Version = "v1",
            Description = "TaskTracker uygulamasýnýn REST API servisi."
        });

    var bearerSecurityScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "JWT token giriniz.",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = JwtBearerDefaults.AuthenticationScheme,
        BearerFormat = "JWT",
        Reference = new OpenApiReference
        {
            Type = ReferenceType.SecurityScheme,
            Id = JwtBearerDefaults.AuthenticationScheme
        }
    };

    options.AddSecurityDefinition(
        JwtBearerDefaults.AuthenticationScheme,
        bearerSecurityScheme);

    options.AddSecurityRequirement(
        new OpenApiSecurityRequirement
        {
            {
                bearerSecurityScheme,
                Array.Empty<string>()
            }
        });
});

#endregion

var app = builder.Build();

#region Middleware Pipeline

// Tüm hatalarý merkezi olarak yakalar
app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();

    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint(
            "/swagger/v1/swagger.json",
            "TaskTracker API v1");

        options.DocumentTitle = "TaskTracker API";
    });
}

// Geliþtirme ortamýnda Android emülatörü HTTP kullanýr.
// Production ortamýnda HTTP istekleri HTTPS'e yönlendirilir.
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// Ionic ve Capacitor eriþimi
app.UseCors("AllowIonic");

// Kullanýcý kimlik doðrulamasý
app.UseAuthentication();

// Yetki kontrolü
app.UseAuthorization();

// Controller endpointleri
app.MapControllers();

// SignalR Hub endpointi
app.MapHub<TaskHub>("/hubs/task");

#endregion

app.Run();