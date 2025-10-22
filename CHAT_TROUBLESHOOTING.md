# 🔧 Chat Troubleshooting Guide

## Issue: Messages Not Sending

### **Quick Checks:**

1. **Open Browser Console** (F12 or Cmd+Option+I)
2. **Look for these messages:**
   - ✅ `Connected to Socket.IO server` - Good!
   - ❌ `Socket not connected` - Problem!
   - ❌ `Socket connection error` - Problem!

---

## 🐛 Common Issues & Fixes

### **1. Socket Not Connected**

**Symptoms:**
- Messages don't send
- Console shows: `❌ Socket not connected`

**Fix:**
```typescript
// The socket should auto-connect when you open the chat
// Check if it's connecting in the Chat.tsx useEffect
```

**Solution:** Ensure socket connects when app loads:

Add to `Dashboard.tsx` or `App.tsx`:
```typescript
import { socketService } from '../services/socket';

useEffect(() => {
  socketService.connect();
}, []);
```

---

### **2. Backend Not Running**

**Symptoms:**
- Console shows: `Socket connection error: xhr poll error`
- Can't connect to `http://localhost:5000`

**Fix:**
```bash
# In terminal, check if backend is running
cd backend
npm run dev

# Should see:
# 🚀 Server is running on port 5000
# 🔌 Socket.IO ready for connections
```

---

### **3. JWT Token Missing**

**Symptoms:**
- Console shows: `No token found, cannot connect to socket`
- Socket connection fails with auth error

**Fix:**
```typescript
// Check if token exists
console.log('Token:', localStorage.getItem('token'));

// If null, you need to login again
```

---

### **4. CORS Issues**

**Symptoms:**
- Console shows: `CORS policy blocked`
- Socket connection fails

**Fix in backend `server.ts`:**
```typescript
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',  // ← Make sure this matches frontend URL
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
```

---

### **5. Wrong Match ID**

**Symptoms:**
- Message sends but doesn't appear
- Console shows: `Failed to send message`

**Fix:**
- Ensure you're using the correct match user ID (not match record ID)
- Check localStorage: `localStorage.getItem('matches')`

---

## 🧪 Testing Steps

### **Step 1: Check Socket Connection**

Open browser console and look for:
```
✅ Connected to Socket.IO server
User 5 joined conversation 8
```

If you see this, socket is working!

### **Step 2: Test Message Send**

Type a message and click send. Look for:
```
📤 Sending message: { matchId: 8, receiverId: 3, content: "Hi!" }
```

If you see this, message is being sent!

### **Step 3: Check Backend Logs**

In your backend terminal, look for:
```
👤 User 5 connected via Socket.IO
User 5 joined conversation 8
```

If you see this, backend received the connection!

---

## 🔍 Debug Commands

### **Frontend (Browser Console):**

```javascript
// Check if socket is connected
socketService.isConnected()

// Check token
localStorage.getItem('token')

// Check matches
JSON.parse(localStorage.getItem('matches'))

// Manually connect
socketService.connect()

// Manually send message
socketService.sendMessage(8, 3, "Test message")
```

### **Backend (Terminal):**

```bash
# Check if server is running
curl http://localhost:5000/health

# Check database connection
# Should return: {"status":"ok","message":"Dating API is running"}
```

---

## 🎯 Expected Flow

### **When Chat Opens:**

```
1. Chat.tsx mounts
   ↓
2. socketService.connect() called
   ↓
3. Socket connects with JWT token
   ↓
4. Backend validates token
   ↓
5. User joins personal room: user:5
   ↓
6. socketService.joinConversation(8) called
   ↓
7. User joins conversation room: conversation:8
   ↓
8. ✅ Ready to send/receive messages!
```

### **When Message Sent:**

```
1. User types message → Clicks Send
   ↓
2. handleSendMessage() called
   ↓
3. socketService.sendMessage(matchId, receiverId, content)
   ↓
4. Socket emits: 'send_message'
   ↓
5. Backend receives event
   ↓
6. Backend saves to database
   ↓
7. Backend emits to conversation room
   ↓
8. Frontend receives: 'new_message'
   ↓
9. Message appears in chat UI
   ↓
10. ✅ Message delivered!
```

---

## 🛠️ Manual Fix

If messages still don't send, try this:

### **1. Clear Everything:**
```javascript
// In browser console
localStorage.clear()
```

### **2. Restart Backend:**
```bash
# Stop backend (Ctrl+C)
# Start again
npm run dev
```

### **3. Restart Frontend:**
```bash
# Stop frontend (Ctrl+C)
# Start again
npm run dev
```

### **4. Login Again:**
- Go to `/login`
- Login with your account
- Go to `/matches`
- Click a match
- Try sending message

---

## 📊 Check Database

Make sure messages table exists:

```sql
-- Run in your database
SELECT * FROM messages LIMIT 5;

-- Should show columns:
-- id, sender_id, receiver_id, content, read_at, created_at
```

---

## 🚨 Still Not Working?

### **Check These:**

1. ✅ Backend running on port 5000
2. ✅ Frontend running on port 3000
3. ✅ JWT token in localStorage
4. ✅ Socket.IO connected (check console)
5. ✅ Match exists (check `/matches`)
6. ✅ Both users are matched (mutual like)

### **Get Detailed Logs:**

Add this to `Chat.tsx` after socket setup:
```typescript
useEffect(() => {
  console.log('🔍 Debug Info:');
  console.log('Match ID:', matchId);
  console.log('Match:', match);
  console.log('Current User ID:', currentUserId);
  console.log('Socket Connected:', socketService.isConnected());
}, [matchId, match, currentUserId]);
```

---

## 💡 Pro Tips

1. **Always check browser console first**
2. **Check backend terminal logs**
3. **Verify both users are matched**
4. **Make sure backend is running**
5. **Clear localStorage if weird issues**

---

## 📞 Common Error Messages

| Error | Meaning | Fix |
|-------|---------|-----|
| `Socket not connected` | Socket.IO not connected | Call `socketService.connect()` |
| `No token found` | Not logged in | Login again |
| `Authentication error` | Invalid token | Logout and login again |
| `xhr poll error` | Backend not running | Start backend |
| `CORS policy blocked` | CORS misconfigured | Check backend CORS settings |
| `Failed to send message` | Database error | Check backend logs |

---

## ✅ Success Indicators

When everything works, you should see:

**Browser Console:**
```
✅ Connected to Socket.IO server
User 5 joined conversation 8
📤 Sending message: {...}
```

**Backend Terminal:**
```
👤 User 5 connected via Socket.IO
User 5 joined conversation 8
```

**Chat UI:**
- Message appears immediately
- No errors in console
- Other user sees message in real-time

---

**If you still have issues, share the console logs and I'll help debug!** 🔍
