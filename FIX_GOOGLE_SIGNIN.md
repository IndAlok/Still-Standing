# 🔧 Fix Google Sign-In Configuration

The `CONFIGURATION_NOT_FOUND` error indicates that Google Sign-In isn't properly configured in your Firebase Console. Here's how to fix it:

## 🚀 Step-by-Step Solution

### 1. **Go to Firebase Console**
Visit: https://console.firebase.google.com/project/crewconnect00

### 2. **Enable Google Sign-In**

1. **Navigate to Authentication**:
   - Click "Authentication" in the left sidebar
   - Click "Sign-in method" tab

2. **Enable Google Provider**:
   - Find "Google" in the list of providers
   - Click on "Google"
   - Toggle "Enable" to ON
   - Add your support email (your Gmail address)
   - Click "Save"

### 3. **Configure Authorized Domains**

1. **In Authentication > Settings**:
   - Click "Authorized domains" tab
   - Make sure these domains are added:
     - `localhost` (for development)
     - `crewconnect00.firebaseapp.com` (your Firebase hosting domain)

2. **Add localhost if missing**:
   - Click "Add domain"
   - Enter: `localhost`
   - Click "Add"

### 4. **Update OAuth Settings (If needed)**

1. **Go to Google Cloud Console**:
   - Visit: https://console.cloud.google.com/apis/credentials
   - Select your project: `crewconnect00`

2. **Configure OAuth Consent Screen**:
   - Click "OAuth consent screen"
   - Fill in required fields:
     - App name: `CrewConnect`
     - User support email: Your email
     - Developer contact: Your email
   - Click "Save"

3. **Update OAuth Client**:
   - Click "Credentials"
   - Find your Web client ID
   - Add authorized origins:
     - `http://localhost:3001`
     - `http://localhost:3000`
   - Add authorized redirect URIs:
     - `http://localhost:3001`
     - `http://localhost:3000`

### 5. **Test the Configuration**

After making these changes:
1. Refresh your app at `http://localhost:3001`
2. Try Google Sign-In again
3. You should see the Google login popup

## 🔄 Alternative: Use Email/Password First

If you want to test immediately while configuring Google Sign-In:

1. **Use Email/Password sign-in** - this should work immediately
2. **Create a test account** with email/password
3. **Test the crew creation and messaging features**
4. **Add Google Sign-In later** once configured

## 📱 Quick Test Commands

After fixing the configuration, test these features in your app:

### 1. **Create Account**:
- Use email/password signup
- Should automatically create user profile

### 2. **Create a Crew**:
```javascript
// This should work through your UI or browser console:
// crewConnectService.createCrew('Test Crew', 'My first crew!', true)
```

### 3. **Test Chat**:
- Join the crew you created
- Send some test messages
- Check real-time updates

## 🐛 Troubleshooting

If Google Sign-In still doesn't work:

1. **Check Browser Console** for detailed errors
2. **Verify API Key** matches your Firebase project
3. **Clear Browser Cache** and cookies
4. **Try Incognito Mode** to eliminate extension conflicts
5. **Check Network Tab** for failed requests

## ✅ Success Indicators

You'll know it's working when:
- ✅ Google Sign-In popup appears without errors
- ✅ User can authenticate successfully
- ✅ User profile is automatically created
- ✅ No console errors about CONFIGURATION_NOT_FOUND

## 📞 Need Help?

If you continue having issues:
1. Check the browser console for specific error messages
2. Verify all Firebase Console settings match the instructions above
3. Make sure your project billing is set up if required

Your CrewConnect app should work perfectly once Google Sign-In is properly configured! 🎉
