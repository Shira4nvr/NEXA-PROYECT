# NEXO mobile builds

The mobile app uses Expo for Android and iOS. A release build must be able to
reach a publicly hosted API; `localhost` is only used automatically during
development in Expo Go.

## Configure the API

Set `EXPO_PUBLIC_API_URL` to the deployed HTTPS API URL, including `/api`, in
the environment used by EAS Build. For local development, copy `.env.example`
to `.env` and replace the example URL with a reachable API address. A physical
device cannot use `localhost` to reach a backend running on the developer's PC.

The release app deliberately shows a configuration message instead of making
requests to a local or insecure server when the HTTPS API URL is missing.

## Build installers

Install and sign in to EAS CLI from the repository root. Configure the mobile
app from its workspace, then run builds from the root:

```powershell
npm install --global eas-cli
eas login
Set-Location packages\mobile
eas build:configure --platform all
Set-Location ..\..
$env:EXPO_PUBLIC_API_URL = "https://your-host.example/api"
npm run build:android --workspace=packages/mobile
npm run build:ios --workspace=packages/mobile
```

Android production builds produce an AAB for Play Store distribution. For an
installable Android APK for internal testing, run
`npm run build:android:preview --workspace=packages/mobile`.
The profile and package identifier in `app.json` must remain stable after
publishing.

iOS builds are submitted to EAS Build, since producing a signed iOS app
requires Apple's signing credentials and distribution through an Apple
developer account. Native iOS builds cannot be produced locally on Windows.
