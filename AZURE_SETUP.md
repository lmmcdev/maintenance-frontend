# Azure AD Authentication Setup

This application uses Microsoft Azure Active Directory (Azure AD) for authentication using the Microsoft Authentication Library (MSAL).

## Prerequisites

1. An Azure subscription and Azure AD tenant
2. Administrative access to create app registrations in Azure AD

## Azure AD App Registration Setup

### Step 1: Create App Registration

1. Sign in to the [Azure portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in the following:
   - **Name**: `Maintenance Frontend App` (or your preferred name)
   - **Supported account types**: Select appropriate option (typically "Accounts in this organizational directory only")
   - **Redirect URI**: 
     - Type: Single-page application (SPA)
     - URL: `http://localhost:3000` (for development)

### Step 2: Configure Authentication

1. In your app registration, go to **Authentication**
2. Under **Single-page application** section, add these redirect URIs:
   - `http://localhost:3000` (development)
   - `https://your-production-domain.com` (production)
3. Under **Implicit grant and hybrid flows**, ensure both options are unchecked (modern MSAL uses authorization code flow with PKCE)

### Step 3: API Permissions

1. Go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Choose **Delegated permissions**
5. Add `User.Read` permission
6. Click **Grant admin consent** (if you have admin privileges)

### Step 4: Get Configuration Values

From your app registration overview page, note down:
- **Application (client) ID**
- **Directory (tenant) ID**

## Environment Configuration

### Step 1: Create Environment File

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your Azure AD configuration in `.env.local`:
   ```env
   NEXT_PUBLIC_AZURE_CLIENT_ID=your_application_client_id_here
   NEXT_PUBLIC_AZURE_AUTHORITY=https://login.microsoftonline.com/your_tenant_id_here
   NEXT_PUBLIC_AZURE_REDIRECT_URI=http://localhost:3000
   ```

### Step 2: Update for Production

For production deployment, update:
- `NEXT_PUBLIC_AZURE_REDIRECT_URI` to your production domain
- Add your production domain to the Azure AD app registration redirect URIs

## Testing the Integration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`
3. Click "Sign in with Azure"
4. Complete the Azure AD authentication flow
5. You should be redirected back to the app with user information displayed

## Troubleshooting

### Common Issues

1. **AADSTS50011: Redirect URI mismatch**
   - Ensure the redirect URI in your app registration matches exactly with your environment variable

2. **AADSTS700016: Application not found**
   - Check that your client ID is correct
   - Verify the app registration exists and is enabled

3. **AADSTS650056: Misconfigured application**
   - Ensure you've selected "Single-page application" as the platform type
   - Check that implicit grant flows are disabled

### Debug Mode

To enable debug logging, add this to your browser's developer console:
```javascript
window.localStorage.setItem('msal.log.level', '2');
```

## Security Considerations

- Never commit `.env.local` or any files containing secrets to version control
- Use environment-specific configurations for different deployment stages
- Regularly rotate client secrets if using confidential client flows
- Review and minimize API permissions to follow principle of least privilege
- Use HTTPS in production environments

## Additional Resources

- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/)
- [MSAL.js Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-overview)
- [Azure AD App Registration Best Practices](https://docs.microsoft.com/en-us/azure/active-directory/develop/security-best-practices-for-app-registration)