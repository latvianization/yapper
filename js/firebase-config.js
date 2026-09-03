// Firebase Configuration & Advanced Features Wrapper for Yapper
const firebaseConfig = {
  apiKey: "AIzaSyCz5BCrd2FE2C7ndj2h2DsMnL5CxcuoFHw",
  authDomain: "yapper-chat.firebaseapp.com",
  projectId: "yapper-chat",
  storageBucket: "yapper-chat.firebasestorage.app",
  messagingSenderId: "623617699938",
  appId: "1:623617699938:web:e0f44ce31ba1987afaa13b",
  measurementId: "G-20LE4J70E6"
};

let firebaseApp = null;
let db = null;
let auth = null;
let storage = null;
let provider = null;

if (typeof firebase !== 'undefined') {
  try {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
    if (firebase.storage) {
      storage = firebase.storage();
    }
    provider = new firebase.auth.GoogleAuthProvider();

    if (firebase.analytics && firebaseConfig.measurementId && window.location.protocol.startsWith('http') && firebaseConfig.apiKey !== "YOUR_API_KEY") {
      try {
        firebase.analytics();
      } catch (ae) {
        console.warn("Analytics skipped:", ae);
      }
    }
  } catch (err) {
    console.warn("Firebase initialization warning (using local fallback mode):", err);
  }
}

// Local mock store for offline/demo operation
const localMockStore = {
  users: JSON.parse(localStorage.getItem('yapper_mock_users') || '[]'),
  companies: JSON.parse(localStorage.getItem('yapper_mock_companies') || '[]'),
  channels: JSON.parse(localStorage.getItem('yapper_mock_channels') || '[]'),
  chats: JSON.parse(localStorage.getItem('yapper_mock_chats') || '[]'),
  messages: JSON.parse(localStorage.getItem('yapper_mock_messages') || '{}'),
  invites: JSON.parse(localStorage.getItem('yapper_mock_invites') || '[]'),
  pinned: JSON.parse(localStorage.getItem('yapper_mock_pinned') || '{}'),
  huddles: JSON.parse(localStorage.getItem('yapper_mock_huddles') || '{}'),
  auditLogs: JSON.parse(localStorage.getItem('yapper_mock_audit_logs') || '[]'),
  offlineQueue: JSON.parse(localStorage.getItem('yapper_offline_queue') || '[]'),
  kudos: JSON.parse(localStorage.getItem('yapper_mock_kudos') || '[]'),
  events: JSON.parse(localStorage.getItem('yapper_events_store') || '[]'),
  save() {
    localStorage.setItem('yapper_mock_users', JSON.stringify(this.users));
    localStorage.setItem('yapper_mock_companies', JSON.stringify(this.companies));
    localStorage.setItem('yapper_mock_channels', JSON.stringify(this.channels));
    localStorage.setItem('yapper_mock_chats', JSON.stringify(this.chats));
    localStorage.setItem('yapper_mock_messages', JSON.stringify(this.messages));
    localStorage.setItem('yapper_mock_invites', JSON.stringify(this.invites));
    localStorage.setItem('yapper_mock_pinned', JSON.stringify(this.pinned));
    localStorage.setItem('yapper_mock_huddles', JSON.stringify(this.huddles));
    localStorage.setItem('yapper_mock_audit_logs', JSON.stringify(this.auditLogs));
    localStorage.setItem('yapper_offline_queue', JSON.stringify(this.offlineQueue));
    localStorage.setItem('yapper_mock_kudos', JSON.stringify(this.kudos));
    localStorage.setItem('yapper_events_store', JSON.stringify(this.events));
  }
};

const fbHelper = {
  isConfigured() {
    return !!(auth && db && firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY");
  },

  // ── Authentication ──────────────────────────────────────────
  signInWithGoogle() {
    if (!auth) return Promise.reject(new Error("Firebase Auth not initialized"));
    return auth.signInWithPopup(provider);
  },

  signInWithEmail(email, password) {
    if (!auth) return Promise.reject(new Error("Firebase Auth not initialized"));
    return auth.signInWithEmailAndPassword(email, password);
  },

  signUpWithEmail(email, password, displayName) {
    if (!auth) return Promise.reject(new Error("Firebase Auth not initialized"));
    return auth.createUserWithEmailAndPassword(email, password).then(async (cred) => {
      if (displayName && cred.user) {
        await cred.user.updateProfile({ displayName });
      }
      return cred;
    });
  },

  signOut() {
    if (!auth) return Promise.resolve();
    return auth.signOut();
  },

  onAuthStateChanged(callback) {
    if (auth) {
      return auth.onAuthStateChanged(callback);
    }
    const mockUser = JSON.parse(localStorage.getItem('yapper_demo_user') || 'null');
    callback(mockUser);
    return () => {};
  },

  // ── Company Management ─────────────────────────────────────
  async createCompany(companyName, creatorUser) {
    const companyId = window.utils.generateId('comp');
    const companyData = {
      id: companyId,
      name: companyName,
      ownerId: creatorUser.uid,
      ownerEmail: creatorUser.email,
      createdAt: firebase.firestore ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
    };

    if (db) {
      await db.collection('companies').doc(companyId).set(companyData);

      const defaultChannels = window.CONSTANTS.DEFAULT_CHANNELS;
      for (const ch of defaultChannels) {
        const chId = window.utils.generateId('chan');
        await db.collection('channels').doc(chId).set({
          id: chId,
          companyId,
          name: ch.name,
          description: ch.description,
          createdBy: creatorUser.uid,
          isPrivate: false,
          memberUids: [creatorUser.uid],
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      await db.collection('users').doc(creatorUser.uid).set({
        uid: creatorUser.uid,
        email: creatorUser.email,
        displayName: creatorUser.displayName || creatorUser.email.split('@')[0],
        photoURL: creatorUser.photoURL || '',
        companyId,
        role: window.CONSTANTS.ROLES.OWNER,
        favorites: [],
        personalGroups: [],
        status: 'online',
        lastSeen: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      await this.logAuditEvent(companyId, window.CONSTANTS.AUDIT_EVENTS.USER_LOGIN, {
        actor: creatorUser.displayName || creatorUser.email,
        details: `Created workspace "${companyName}"`
      });

      return companyData;
    } else {
      localMockStore.companies.push(companyData);
      localMockStore.save();
      await this.logAuditEvent(companyId, window.CONSTANTS.AUDIT_EVENTS.USER_LOGIN, {
        actor: creatorUser.displayName || creatorUser.email,
        details: `Created workspace "${companyName}" (demo)`
      });
      return companyData;
    }
  },

  async getCompany(companyId) {
    if (!companyId) return null;
    if (db) {
      const doc = await db.collection('companies').doc(companyId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }
    return localMockStore.companies.find(c => c.id === companyId) || null;
  },

  async getCompanyUsers(companyId) {
    if (!companyId) return [];
    if (db) {
      const snap = await db.collection('users').where('companyId', '==', companyId).get();
      return snap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    }
    return localMockStore.users.filter(u => u.companyId === companyId);
  },

  // ── Invites ────────────────────────────────────────────────
  async sendInvite(companyId, companyName, email, role, invitedBy) {
    const inviteId = window.utils.generateId('inv');
    const inviteData = {
      id: inviteId,
      companyId,
      companyName,
      email: email.trim().toLowerCase(),
      role: role || window.CONSTANTS.ROLES.MEMBER,
      invitedBy: invitedBy.displayName || invitedBy.email,
      invitedByUid: invitedBy.uid,
      status: 'pending',
      createdAt: firebase.firestore ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
    };

    if (db) {
      await db.collection('invites').doc(inviteId).set(inviteData);
    } else {
      localMockStore.invites.push(inviteData);
      localMockStore.save();
    }

    await this.logAuditEvent(companyId, window.CONSTANTS.AUDIT_EVENTS.USER_INVITED, {
      actor: invitedBy.displayName || invitedBy.email,
      details: `Invited ${email} as ${role}`
    });

    return inviteData;
  },

  async getCompanyInvites(companyId) {
    if (!companyId) return [];
    if (db) {
      const snap = await db.collection('invites').where('companyId', '==', companyId).get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    return localMockStore.invites.filter(i => i.companyId === companyId);
  },

  async getPendingInvitesForEmail(email) {
    if (!email) return [];
    const normalized = email.trim().toLowerCase();
    if (db) {
      const snap = await db.collection('invites')
        .where('email', '==', normalized)
        .where('status', '==', 'pending')
        .get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    return localMockStore.invites.filter(i => i.email === normalized && i.status === 'pending');
  },

  async revokeInvite(inviteId, companyId, actorName = 'Admin') {
    if (db) {
      await db.collection('invites').doc(inviteId).delete();
    } else {
      localMockStore.invites = localMockStore.invites.filter(i => i.id !== inviteId);
      localMockStore.save();
    }
    if (companyId) {
      await this.logAuditEvent(companyId, window.CONSTANTS.AUDIT_EVENTS.INVITE_REVOKED, {
        actor: actorName,
        details: `Revoked invite ${inviteId}`
      });
    }
  },

  // ── Workspace Events & Event Chat Rooms ─────────────────────
  async createCompanyEvent(companyId, eventData) {
    const eventId = window.utils.generateId('evt');
    const newEvent = {
      id: eventId,
      companyId,
      title: eventData.title.trim(),
      description: eventData.description || '',
      category: eventData.category || window.CONSTANTS.EVENT_CATEGORIES[0],
      location: eventData.location || 'Voice Huddle Stage',
      channelId: eventData.channelId || null,
      startDate: eventData.startDate, // ISO String or local date
      durationMinutes: eventData.durationMinutes || 60,
      hostUid: eventData.hostUid,
      hostName: eventData.hostName,
      isLive: false,
      rsvps: {
        going: [eventData.hostUid],
        interested: [],
        notGoing: []
      },
      createdAt: firebase.firestore ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
    };

    if (db) {
      await db.collection('companies').doc(companyId).collection('events').doc(eventId).set(newEvent);
    } else {
      localMockStore.events.unshift(newEvent);
      localMockStore.save();
    }

    await this.logAuditEvent(companyId, window.CONSTANTS.AUDIT_EVENTS.EVENT_CREATED, {
      actor: eventData.hostName,
      details: `Scheduled event "${newEvent.title}" for ${newEvent.startDate}`
    });

    return newEvent;
  },

  async getCompanyEvents(companyId) {
    if (!companyId) return [];
    if (db) {
      try {
        const snap = await db.collection('companies').doc(companyId).collection('events')
          .orderBy('startDate', 'asc')
          .get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e) {
        return localMockStore.events.filter(ev => ev.companyId === companyId);
      }
    }
    return localMockStore.events.filter(ev => ev.companyId === companyId);
  },

  async rsvpEvent(companyId, eventId, status, user) {
    if (!user || !user.uid) return;
    if (db) {
      const docRef = db.collection('companies').doc(companyId).collection('events').doc(eventId);
      const doc = await docRef.get();
      if (!doc.exists) return;
      const data = doc.data();
      const rsvps = data.rsvps || { going: [], interested: [], notGoing: [] };

      // Remove from all arrays first
      rsvps.going = (rsvps.going || []).filter(u => u !== user.uid);
      rsvps.interested = (rsvps.interested || []).filter(u => u !== user.uid);
      rsvps.notGoing = (rsvps.notGoing || []).filter(u => u !== user.uid);

      if (status === 'going') rsvps.going.push(user.uid);
      else if (status === 'interested') rsvps.interested.push(user.uid);
      else if (status === 'notGoing') rsvps.notGoing.push(user.uid);

      await docRef.update({ rsvps });
    } else {
      const ev = localMockStore.events.find(e => e.id === eventId);
      if (ev) {
        if (!ev.rsvps) ev.rsvps = { going: [], interested: [], notGoing: [] };
        ev.rsvps.going = (ev.rsvps.going || []).filter(u => u !== user.uid);
        ev.rsvps.interested = (ev.rsvps.interested || []).filter(u => u !== user.uid);
        ev.rsvps.notGoing = (ev.rsvps.notGoing || []).filter(u => u !== user.uid);

        if (status === 'going') ev.rsvps.going.push(user.uid);
        else if (status === 'interested') ev.rsvps.interested.push(user.uid);
        else if (status === 'notGoing') ev.rsvps.notGoing.push(user.uid);
        localMockStore.save();
      }
    }
  },

  async toggleLiveEvent(companyId, eventId, isLive) {
    if (db) {
      await db.collection('companies').doc(companyId).collection('events').doc(eventId).update({ isLive });
    } else {
      const ev = localMockStore.events.find(e => e.id === eventId);
      if (ev) {
        ev.isLive = isLive;
        localMockStore.save();
      }
    }
    if (isLive) {
      await this.logAuditEvent(companyId, window.CONSTANTS.AUDIT_EVENTS.EVENT_STARTED, {
        actor: 'Host',
        details: `Event ${eventId} went LIVE`
      });
    }
  },

  async deleteCompanyEvent(companyId, eventId) {
    if (db) {
      await db.collection('companies').doc(companyId).collection('events').doc(eventId).delete();
    } else {
      localMockStore.events = localMockStore.events.filter(e => e.id !== eventId);
      localMockStore.save();
    }
  },

  // ── Workspace Audit Logs ───────────────────────────────────
  async logAuditEvent(companyId, eventType, data = {}) {
    if (!companyId) return;
    const logEntry = {
      id: window.utils.generateId('audit'),
      companyId,
      eventType,
      actor: data.actor || 'System',
      details: data.details || '',
      timestamp: firebase.firestore ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
    };

    if (db) {
      try {
        await db.collection('companies').doc(companyId).collection('audit_logs').doc(logEntry.id).set(logEntry);
      } catch (err) {
        console.warn("Audit logging error:", err);
      }
    } else {
      localMockStore.auditLogs.unshift(logEntry);
      localMockStore.save();
    }
  },

  async getAuditLogs(companyId) {
    if (!companyId) return [];
    if (db) {
      const snap = await db.collection('companies').doc(companyId).collection('audit_logs')
        .orderBy('timestamp', 'desc')
        .limit(50)
        .get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    return localMockStore.auditLogs.filter(l => l.companyId === companyId);
  },

  // ── Peer Kudos & Recognition System ────────────────────────
  async awardKudos(companyId, kudosData) {
    const kudosId = window.utils.generateId('kudos');
    const entry = {
      id: kudosId,
      companyId,
      senderId: kudosData.senderId,
      senderName: kudosData.senderName,
      recipientId: kudosData.recipientId,
      recipientName: kudosData.recipientName,
      badge: kudosData.badge,
      reason: kudosData.reason,
      timestamp: firebase.firestore ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
    };

    if (db) {
      try {
        await db.collection('companies').doc(companyId).collection('kudos').doc(kudosId).set(entry);
      } catch (err) {
        console.warn("Kudos db save error:", err);
      }
    } else {
      localMockStore.kudos.unshift(entry);
      localMockStore.save();
    }

    await this.logAuditEvent(companyId, window.CONSTANTS.AUDIT_EVENTS.KUDOS_AWARDED, {
      actor: kudosData.senderName,
      details: `Awarded ${kudosData.badge.name} to ${kudosData.recipientName}`
    });

    return entry;
  },

  async getKudosLeaderboard(companyId) {
    let allKudos = [];
    if (db) {
      try {
        const snap = await db.collection('companies').doc(companyId).collection('kudos').get();
        allKudos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e) {
        allKudos = localMockStore.kudos.filter(k => k.companyId === companyId);
      }
    } else {
      allKudos = localMockStore.kudos.filter(k => k.companyId === companyId);
    }

    const leaderboard = {};
    allKudos.forEach(k => {
      const rec = k.recipientName || 'Teammate';
      if (!leaderboard[rec]) {
        leaderboard[rec] = { name: rec, recipientId: k.recipientId, count: 0, badges: [] };
      }
      leaderboard[rec].count++;
      leaderboard[rec].badges.push(k.badge);
    });

    return Object.values(leaderboard).sort((a, b) => b.count - a.count);
  },

  // ── User Profiles & Personal Custom Groups ──────────────────
  async getUserProfile(uid) {
    if (!uid) return null;
    if (db) {
      const doc = await db.collection('users').doc(uid).get();
      return doc.exists ? { uid: doc.id, ...doc.data() } : null;
    }
    return localMockStore.users.find(u => u.uid === uid) || null;
  },

  async saveUserProfile(uid, profileData) {
    if (db) {
      await db.collection('users').doc(uid).set({
        ...profileData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
  },

  async setUserStatus(uid, status, statusMessage = '') {
    if (!uid) return;
    if (db) {
      await db.collection('users').doc(uid).update({
        status,
        statusMessage,
        lastSeen: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  },

  async toggleFavorite(currentUid, targetUid, currentFavorites = []) {
    const isFav = currentFavorites.includes(targetUid);
    const newFavorites = isFav
      ? currentFavorites.filter(id => id !== targetUid)
      : [...currentFavorites, targetUid];

    if (db) {
      await db.collection('users').doc(currentUid).update({
        favorites: newFavorites
      });
    }
    return newFavorites;
  },

  async savePersonalGroup(uid, group, existingGroups = []) {
    const groupList = [...existingGroups];
    const idx = groupList.findIndex(g => g.id === group.id);
    if (idx >= 0) {
      groupList[idx] = group;
    } else {
      groupList.push(group);
    }
    if (db) {
      await db.collection('users').doc(uid).update({
        personalGroups: groupList
      });
    }
    return groupList;
  },

  async deletePersonalGroup(uid, groupId, existingGroups = []) {
    const updated = existingGroups.filter(g => g.id !== groupId);
    if (db) {
      await db.collection('users').doc(uid).update({
        personalGroups: updated
      });
    }
    return updated;
  },

  // ── Channels (Company Groups) ──────────────────────────────
  async getCompanyChannels(companyId) {
    if (!companyId) return [];
    if (db) {
      const snap = await db.collection('channels').where('companyId', '==', companyId).get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    return localMockStore.channels.filter(c => c.companyId === companyId);
  },

  async createChannel(companyId, channelData) {
    const channelId = window.utils.generateId('chan');
    const payload = {
      id: channelId,
      companyId,
      name: channelData.name.toLowerCase().trim().replace(/\s+/g, '-'),
      description: channelData.description || '',
      isPrivate: !!channelData.isPrivate,
      memberUids: channelData.memberUids || [],
      createdBy: channelData.createdBy,
      createdAt: firebase.firestore ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
    };

    if (db) {
      await db.collection('channels').doc(channelId).set(payload);
    } else {
      localMockStore.channels.push(payload);
      localMockStore.save();
    }

    await this.logAuditEvent(companyId, window.CONSTANTS.AUDIT_EVENTS.CHANNEL_CREATED, {
      actor: channelData.createdBy || 'User',
      details: `Created channel #${payload.name}`
    });

    return payload;
  },

  // ── Real-Time Messaging & Ephemeral Expiry Cleanup ─────────
  listenToChatMessages(chatId, callback) {
    if (!chatId) return () => {};
    if (db) {
      return db.collection('chats').doc(chatId).collection('messages')
        .orderBy('timestamp', 'asc')
        .limit(200)
        .onSnapshot((snap) => {
          const now = Date.now();
          const msgs = [];
          snap.docs.forEach(doc => {
            const data = doc.data();
            if (data.expiresAt && data.expiresAt < now) {
              doc.ref.delete().catch(() => {});
            } else {
              msgs.push({ id: doc.id, ...data });
            }
          });
          callback(msgs);
        }, (error) => {
          console.error("Messages listener error:", error);
        });
    }

    const now = Date.now();
    const chatMsgs = (localMockStore.messages[chatId] || []).filter(m => !m.expiresAt || m.expiresAt >= now);
    localMockStore.messages[chatId] = chatMsgs;
    callback(chatMsgs);
    return () => {};
  },

  async sendMessage(chatId, messageData) {
    const messageId = window.utils.generateId('msg');
    const now = Date.now();
    const expiresAt = messageData.ephemeralDuration ? (now + messageData.ephemeralDuration) : null;

    const payload = {
      id: messageId,
      senderId: messageData.senderId,
      senderName: messageData.senderName,
      senderPhoto: messageData.senderPhoto || '',
      text: messageData.text || '',
      transcript: messageData.transcript || '',
      attachments: messageData.attachments || [],
      replyTo: messageData.replyTo || null,
      poll: messageData.poll || null,
      taskList: messageData.taskList || null,
      kudos: messageData.kudos || null,
      event: messageData.event || null,
      isE2EE: !!messageData.isE2EE,
      cipherPayload: messageData.cipherPayload || null,
      soundEffect: messageData.soundEffect || null,
      expiresAt: expiresAt,
      ephemeralDuration: messageData.ephemeralDuration || 0,
      reactions: {},
      isPinned: false,
      readBy: [messageData.senderId],
      timestamp: firebase.firestore ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
    };

    if (!navigator.onLine) {
      localMockStore.offlineQueue.push({ chatId, payload });
      localMockStore.save();
      return payload;
    }

    if (db) {
      await db.collection('chats').doc(chatId).collection('messages').doc(messageId).set(payload);

      await db.collection('chats').doc(chatId).set({
        lastMessage: {
          text: payload.isE2EE ? '🔒 Encrypted message' : (payload.text || (payload.attachments.length ? `[Attachment: ${payload.attachments[0].name}]` : (payload.poll ? `📊 Poll: ${payload.poll.question}` : (payload.taskList ? `✅ Task List: ${payload.taskList.title}` : (payload.kudos ? `🌟 Kudos to ${payload.kudos.recipientName}` : (payload.event ? `📅 Event: ${payload.event.title}` : '')))))),
          senderId: payload.senderId,
          senderName: payload.senderName,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        },
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } else {
      if (!localMockStore.messages[chatId]) localMockStore.messages[chatId] = [];
      localMockStore.messages[chatId].push(payload);
      localMockStore.save();
    }
    return payload;
  },

  async flushOfflineQueue() {
    if (localMockStore.offlineQueue.length === 0) return;
    const queue = [...localMockStore.offlineQueue];
    localMockStore.offlineQueue = [];
    localMockStore.save();

    for (const item of queue) {
      try {
        await this.sendMessage(item.chatId, item.payload);
      } catch (err) {
        console.warn("Error flushing offline message:", err);
      }
    }
  },

  async editMessage(chatId, messageId, newText) {
    if (db) {
      await db.collection('chats').doc(chatId).collection('messages').doc(messageId).update({
        text: newText,
        editedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } else {
      const chatMsgs = localMockStore.messages[chatId] || [];
      const msg = chatMsgs.find(m => m.id === messageId);
      if (msg) {
        msg.text = newText;
        msg.editedAt = new Date().toISOString();
        localMockStore.save();
      }
    }
  },

  async deleteMessage(chatId, messageId) {
    if (db) {
      await db.collection('chats').doc(chatId).collection('messages').doc(messageId).delete();
    } else {
      if (localMockStore.messages[chatId]) {
        localMockStore.messages[chatId] = localMockStore.messages[chatId].filter(m => m.id !== messageId);
        localMockStore.save();
      }
    }
  },

  async toggleReaction(chatId, messageId, emoji, user) {
    if (db) {
      const msgRef = db.collection('chats').doc(chatId).collection('messages').doc(messageId);
      const msgDoc = await msgRef.get();
      if (!msgDoc.exists) return;
      const data = msgDoc.data();
      const reactions = data.reactions || {};
      const usersList = reactions[emoji] || [];

      const idx = usersList.findIndex(u => u.uid === user.uid);
      if (idx >= 0) {
        usersList.splice(idx, 1);
        if (usersList.length === 0) delete reactions[emoji];
        else reactions[emoji] = usersList;
      } else {
        reactions[emoji] = [...usersList, { uid: user.uid, name: user.displayName || user.email }];
      }

      await msgRef.update({ reactions });
    } else {
      const msgs = localMockStore.messages[chatId] || [];
      const msg = msgs.find(m => m.id === messageId);
      if (msg) {
        if (!msg.reactions) msg.reactions = {};
        const usersList = msg.reactions[emoji] || [];
        const idx = usersList.findIndex(u => u.uid === user.uid);
        if (idx >= 0) {
          usersList.splice(idx, 1);
          if (usersList.length === 0) delete msg.reactions[emoji];
          else msg.reactions[emoji] = usersList;
        } else {
          msg.reactions[emoji] = [...usersList, { uid: user.uid, name: user.displayName || user.email }];
        }
        localMockStore.save();
      }
    }
  },

  async togglePinMessage(chatId, messageId, isPinned) {
    if (db) {
      await db.collection('chats').doc(chatId).collection('messages').doc(messageId).update({
        isPinned: !isPinned
      });
    } else {
      const msgs = localMockStore.messages[chatId] || [];
      const msg = msgs.find(m => m.id === messageId);
      if (msg) {
        msg.isPinned = !isPinned;
        localMockStore.save();
      }
    }
  },

  async votePoll(chatId, messageId, optionIndex, user) {
    if (db) {
      const msgRef = db.collection('chats').doc(chatId).collection('messages').doc(messageId);
      const doc = await msgRef.get();
      if (!doc.exists) return;
      const data = doc.data();
      if (!data.poll) return;

      const poll = data.poll;
      poll.options.forEach((opt, idx) => {
        if (!opt.voterUids) opt.voterUids = [];
        const uIdx = opt.voterUids.indexOf(user.uid);
        if (idx === optionIndex) {
          if (uIdx === -1) opt.voterUids.push(user.uid);
        } else {
          if (uIdx >= 0) opt.voterUids.splice(uIdx, 1);
        }
      });

      await msgRef.update({ poll });
    } else {
      const msgs = localMockStore.messages[chatId] || [];
      const msg = msgs.find(m => m.id === messageId);
      if (msg && msg.poll) {
        msg.poll.options.forEach((opt, idx) => {
          if (!opt.voterUids) opt.voterUids = [];
          const uIdx = opt.voterUids.indexOf(user.uid);
          if (idx === optionIndex) {
            if (uIdx === -1) opt.voterUids.push(user.uid);
          } else {
            if (uIdx >= 0) opt.voterUids.splice(uIdx, 1);
          }
        });
        localMockStore.save();
      }
    }
  },

  async toggleTaskItem(chatId, messageId, itemIndex, user) {
    if (db) {
      const msgRef = db.collection('chats').doc(chatId).collection('messages').doc(messageId);
      const doc = await msgRef.get();
      if (!doc.exists) return;
      const data = doc.data();
      if (!data.taskList) return;

      const taskList = data.taskList;
      if (taskList.items[itemIndex]) {
        taskList.items[itemIndex].done = !taskList.items[itemIndex].done;
        taskList.items[itemIndex].completedBy = taskList.items[itemIndex].done ? (user.displayName || user.email) : null;
      }

      await msgRef.update({ taskList });
    } else {
      const msgs = localMockStore.messages[chatId] || [];
      const msg = msgs.find(m => m.id === messageId);
      if (msg && msg.taskList && msg.taskList.items[itemIndex]) {
        msg.taskList.items[itemIndex].done = !msg.taskList.items[itemIndex].done;
        msg.taskList.items[itemIndex].completedBy = msg.taskList.items[itemIndex].done ? (user.displayName || user.email) : null;
        localMockStore.save();
      }
    }
  },

  async getOrCreateDirectChat(companyId, user1, user2) {
    const participants = [user1.uid, user2.uid].sort();
    const chatId = `dm_${participants.join('_')}`;

    if (db) {
      const chatRef = db.collection('chats').doc(chatId);
      const chatDoc = await chatRef.get();
      if (!chatDoc.exists) {
        await chatRef.set({
          id: chatId,
          type: 'direct',
          companyId,
          participants,
          participantDetails: {
            [user1.uid]: { displayName: user1.displayName, email: user1.email, photoURL: user1.photoURL || '' },
            [user2.uid]: { displayName: user2.displayName, email: user2.email, photoURL: user2.photoURL || '' }
          },
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      return { id: chatId, type: 'direct', participants };
    }
    return { id: chatId, type: 'direct', participants };
  },

  // ── WebRTC Audio Huddle Signaling ──────────────────────────
  joinHuddle(channelId, user) {
    const participantObj = {
      uid: user.uid,
      displayName: user.displayName || user.email,
      photoURL: user.photoURL || '',
      joinedAt: firebase.firestore ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
    };
    if (db) {
      db.collection('huddles').doc(channelId).collection('participants').doc(user.uid).set(participantObj);
    } else {
      if (!localMockStore.huddles[channelId]) localMockStore.huddles[channelId] = [];
      if (!localMockStore.huddles[channelId].some(u => u.uid === user.uid)) {
        localMockStore.huddles[channelId].push(participantObj);
        localMockStore.save();
      }
    }
  },

  leaveHuddle(channelId, userUid) {
    if (db) {
      db.collection('huddles').doc(channelId).collection('participants').doc(userUid).delete();
    } else {
      if (localMockStore.huddles[channelId]) {
        localMockStore.huddles[channelId] = localMockStore.huddles[channelId].filter(u => u.uid !== userUid);
        localMockStore.save();
      }
    }
  },

  listenToHuddleParticipants(channelId, callback) {
    if (db) {
      return db.collection('huddles').doc(channelId).collection('participants')
        .onSnapshot(snap => {
          callback(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
        });
    }
    callback(localMockStore.huddles[channelId] || []);
    return () => {};
  },

  // ── Attachments & Storage ──────────────────────────────────
  async uploadAttachment(file, pathPrefix = 'attachments') {
    if (storage) {
      try {
        const fileExt = file.name ? file.name.split('.').pop() : 'webm';
        const storageRef = storage.ref(`${pathPrefix}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`);
        const snapshot = await storageRef.put(file);
        const downloadUrl = await snapshot.ref.getDownloadURL();
        return {
          name: file.name || 'attachment.webm',
          url: downloadUrl,
          size: file.size,
          type: window.utils.getFileCategory(file),
          mimeType: file.type
        };
      } catch (err) {
        console.warn("Storage upload failed, falling back to base64 encoding", err);
      }
    }

    const dataUrl = await window.utils.readFileAsDataURL(file);
    return {
      name: file.name || 'attachment.webm',
      url: dataUrl,
      size: file.size,
      type: window.utils.getFileCategory(file),
      mimeType: file.type
    };
  }
};

window.fbHelper = fbHelper;
