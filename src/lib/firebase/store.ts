import { db } from './config';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  deleteDoc,
  writeBatch 
} from 'firebase/firestore';
import { 
  BimbelState, 
  UserAccount,
  Student, 
  Attendance, 
  TeacherAttendance, 
  Assessment, 
  DailyActivity, 
  ChatMessage, 
  Invoice, 
  ScheduleItem, 
  BroadcastMessage,
  BankAccountInfo,
  BimbelLocation
} from '../../types';
import { INITIAL_EMPTY_STATE, DEFAULT_BANK_ACCOUNT, DEFAULT_BIMBEL_LOCATIONS, sanitizeBimbelState } from '../../dataStore';

// Helper to purge all master data (students, teachers, etc.) from Firestore and leave clean slate
export async function clearFirestoreCollections() {
  try {
    const collectionsToClear = [
      'students',
      'attendance',
      'teacherAttendance',
      'assessments',
      'activities',
      'chats',
      'invoices',
      'schedules',
      'broadcasts',
      'locations',
    ];

    for (const colName of collectionsToClear) {
      const snap = await getDocs(collection(db, colName));
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach((docSnap) => batch.delete(docSnap.ref));
        await batch.commit();
      }
    }

    // Clean all non-super-admin users (teachers, parents) from users collection
    const usersSnap = await getDocs(collection(db, 'users'));
    if (!usersSnap.empty) {
      const batch = writeBatch(db);
      let count = 0;
      usersSnap.docs.forEach((docSnap) => {
        const id = docSnap.id;
        const data = docSnap.data() as UserAccount;
        if (id !== 'usr-super-admin' && data?.email !== 'depi@gmail.com') {
          batch.delete(docSnap.ref);
          count++;
        }
      });
      if (count > 0) {
        await batch.commit();
      }
    }

    // Ensure super admin exists with new credentials
    await setDoc(doc(db, 'users', INITIAL_EMPTY_STATE.users[0].id), INITIAL_EMPTY_STATE.users[0]);
    console.log('Firestore successfully updated with admin account depi@gmail.com');
  } catch (error) {
    console.error('Error clearing Firestore collections:', error);
  }
}

// Helper to seed initial data to Firestore if completely empty
export async function seedInitialFirestoreData() {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    if (usersSnap.empty) {
      console.log('Initializing super admin account to Firebase Firestore...');
      const batch = writeBatch(db);
      INITIAL_EMPTY_STATE.users.forEach(item => {
        batch.set(doc(db, 'users', item.id), item);
      });
      if (INITIAL_EMPTY_STATE.locations) {
        INITIAL_EMPTY_STATE.locations.forEach(item => {
          batch.set(doc(db, 'locations', item.id), item);
        });
      }
      await batch.commit();
    }
  } catch (error) {
    console.error('Error seeding Firebase data:', error);
  }
}

// Save full state back to Firestore collections
export async function syncStateToFirestore(state: BimbelState) {
  try {
    const batch = writeBatch(db);

    // Save individual entity items
    state.users.forEach(item => batch.set(doc(db, 'users', item.id), item));
    state.students.forEach(item => batch.set(doc(db, 'students', item.id), item));
    state.attendance.forEach(item => batch.set(doc(db, 'attendance', item.id), item));
    if (state.teacherAttendance) {
      state.teacherAttendance.forEach(item => batch.set(doc(db, 'teacherAttendance', item.id), item));
    }
    state.assessments.forEach(item => batch.set(doc(db, 'assessments', item.id), item));
    state.activities.forEach(item => batch.set(doc(db, 'activities', item.id), item));
    state.chats.forEach(item => batch.set(doc(db, 'chats', item.id), item));
    state.invoices.forEach(item => batch.set(doc(db, 'invoices', item.id), item));
    state.schedules.forEach(item => batch.set(doc(db, 'schedules', item.id), item));
    state.broadcasts.forEach(item => batch.set(doc(db, 'broadcasts', item.id), item));
    if (state.locations) {
      state.locations.forEach(item => batch.set(doc(db, 'locations', item.id), item));
    }
    if (state.bankAccount) {
      batch.set(doc(db, 'settings', 'bankAccount'), state.bankAccount);
    }

    await batch.commit();
  } catch (error) {
    console.error('Error syncing state to Firestore:', error);
  }
}

export async function firestoreUpdateBankAccount(bankAccount: BankAccountInfo) {
  try {
    await setDoc(doc(db, 'settings', 'bankAccount'), bankAccount);
  } catch (err) {
    console.error('Firestore update bank account failed:', err);
  }
}

// Individual Firestore helper functions
export async function firestoreAddUser(user: UserAccount) {
  try {
    await setDoc(doc(db, 'users', user.id), user);
  } catch (err) {
    console.error('Firestore add user failed:', err);
  }
}

export async function firestoreUpdateUser(user: UserAccount) {
  try {
    await setDoc(doc(db, 'users', user.id), user, { merge: true });
  } catch (err) {
    console.error('Firestore update user failed:', err);
  }
}

export async function firestoreDeleteUser(userId: string) {
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (err) {
    console.error('Firestore delete user failed:', err);
  }
}

// Individual Firestore helper functions
export async function firestoreAddStudent(student: Student, invoice?: Invoice | null, schedule?: ScheduleItem | null) {
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'students', student.id), student);
    if (invoice) {
      batch.set(doc(db, 'invoices', invoice.id), invoice);
    }
    if (schedule) {
      batch.set(doc(db, 'schedules', schedule.id), schedule);
    }
    await batch.commit();
  } catch (err) {
    console.error('Firestore add student failed:', err);
  }
}

export async function firestoreUpdateStudent(student: Student) {
  try {
    await setDoc(doc(db, 'students', student.id), student, { merge: true });
  } catch (err) {
    console.error('Firestore update student failed:', err);
  }
}

export async function firestoreDeleteStudent(studentId: string) {
  try {
    await deleteDoc(doc(db, 'students', studentId));
  } catch (err) {
    console.error('Firestore delete student failed:', err);
  }
}

export async function firestoreAddAssessment(assessment: Assessment) {
  try {
    await setDoc(doc(db, 'assessments', assessment.id), assessment);
  } catch (err) {
    console.error('Firestore add assessment failed:', err);
  }
}

export async function firestoreUpdateAssessment(assessment: Assessment) {
  try {
    await setDoc(doc(db, 'assessments', assessment.id), assessment, { merge: true });
  } catch (err) {
    console.error('Firestore update assessment failed:', err);
  }
}

export async function firestoreDeleteAssessment(assessmentId: string) {
  try {
    await deleteDoc(doc(db, 'assessments', assessmentId));
  } catch (err) {
    console.error('Firestore delete assessment failed:', err);
  }
}

export async function firestoreAddActivity(activity: DailyActivity) {
  try {
    await setDoc(doc(db, 'activities', activity.id), activity);
  } catch (err) {
    console.error('Firestore add activity failed:', err);
  }
}

export async function firestoreAddBroadcast(broadcast: BroadcastMessage) {
  try {
    await setDoc(doc(db, 'broadcasts', broadcast.id), broadcast);
  } catch (err) {
    console.error('Firestore add broadcast failed:', err);
  }
}

export async function firestoreUpdateBroadcast(broadcast: BroadcastMessage) {
  try {
    await setDoc(doc(db, 'broadcasts', broadcast.id), broadcast);
  } catch (err) {
    console.error('Firestore update broadcast failed:', err);
  }
}

export async function firestoreDeleteBroadcast(broadcastId: string) {
  try {
    await deleteDoc(doc(db, 'broadcasts', broadcastId));
  } catch (err) {
    console.error('Firestore delete broadcast failed:', err);
  }
}

export async function firestoreAddChatMessage(chat: ChatMessage) {
  try {
    await setDoc(doc(db, 'chats', chat.id), chat);
  } catch (err) {
    console.error('Firestore add chat failed:', err);
  }
}

export async function firestoreUpdateChatMessage(chat: ChatMessage) {
  try {
    await setDoc(doc(db, 'chats', chat.id), chat, { merge: true });
  } catch (err) {
    console.error('Firestore update chat message failed:', err);
  }
}

export async function firestoreMarkChatsAsRead(chatIds: string[]) {
  if (!chatIds || chatIds.length === 0) return;
  try {
    const batch = writeBatch(db);
    const nowStr = new Date().toISOString();
    chatIds.forEach((id) => {
      const chatRef = doc(db, 'chats', id);
      batch.update(chatRef, {
        status: 'read',
        isRead: true,
        readAt: nowStr,
      });
    });
    await batch.commit();
  } catch (err) {
    console.error('Firestore mark chats as read failed:', err);
  }
}

export async function firestoreSaveAttendanceBulk(records: Attendance[]) {
  try {
    const batch = writeBatch(db);
    records.forEach(rec => {
      batch.set(doc(db, 'attendance', rec.id), rec);
    });
    await batch.commit();
  } catch (err) {
    console.error('Firestore save attendance bulk failed:', err);
  }
}

export async function firestoreSaveTeacherAttendanceBulk(records: TeacherAttendance[]) {
  try {
    const batch = writeBatch(db);
    records.forEach(rec => {
      batch.set(doc(db, 'teacherAttendance', rec.id), rec);
    });
    await batch.commit();
  } catch (err) {
    console.error('Firestore save teacher attendance bulk failed:', err);
  }
}

export async function firestoreDeleteTeacherAttendance(id: string) {
  try {
    await deleteDoc(doc(db, 'teacherAttendance', id));
  } catch (err) {
    console.error('Firestore delete teacher attendance failed:', err);
  }
}

export async function firestoreDeleteAttendance(id: string) {
  try {
    await deleteDoc(doc(db, 'attendance', id));
  } catch (err) {
    console.error('Firestore delete attendance failed:', err);
  }
}

export async function firestoreAddLocation(location: BimbelLocation) {
  try {
    await setDoc(doc(db, 'locations', location.id), location);
  } catch (err) {
    console.error('Firestore add location failed:', err);
  }
}

export async function firestoreUpdateLocation(location: BimbelLocation) {
  try {
    await setDoc(doc(db, 'locations', location.id), location, { merge: true });
  } catch (err) {
    console.error('Firestore update location failed:', err);
  }
}

export async function firestoreDeleteLocation(locationId: string) {
  try {
    await deleteDoc(doc(db, 'locations', locationId));
  } catch (err) {
    console.error('Firestore delete location failed:', err);
  }
}

export async function firestoreUpdateInvoiceStatus(invoiceId: string, status: 'Lunas' | 'Belum Bayar' | 'Terlambat', currentInvoice?: Invoice) {
  try {
    if (currentInvoice) {
      await setDoc(doc(db, 'invoices', invoiceId), { ...currentInvoice, status });
    }
  } catch (err) {
    console.error('Firestore update invoice status failed:', err);
  }
}

export async function firestoreDeleteInvoice(invoiceId: string) {
  try {
    await deleteDoc(doc(db, 'invoices', invoiceId));
  } catch (err) {
    console.error('Firestore delete invoice failed:', err);
  }
}

export async function firestoreAddSchedule(schedule: ScheduleItem) {
  try {
    await setDoc(doc(db, 'schedules', schedule.id), schedule);
  } catch (err) {
    console.error('Firestore add schedule failed:', err);
  }
}

export async function firestoreDeleteSchedule(scheduleId: string) {
  try {
    await deleteDoc(doc(db, 'schedules', scheduleId));
  } catch (err) {
    console.error('Firestore delete schedule failed:', err);
  }
}

// Setup real-time listeners across all collections
export function subscribeToBimbelState(
  onUpdate: (state: BimbelState) => void,
  onStatusChange: (connected: boolean) => void
) {
  const collectionsData: Partial<BimbelState> = {
    users: [],
    students: [],
    attendance: [],
    teacherAttendance: [],
    assessments: [],
    activities: [],
    chats: [],
    invoices: [],
    schedules: [],
    broadcasts: [],
    bankAccount: DEFAULT_BANK_ACCOUNT,
    locations: DEFAULT_BIMBEL_LOCATIONS,
    activeLocationId: 'loc-pusat',
  };

  let hasSeeded = false;

  const checkAndEmit = async () => {
    // Ensure Super Admin Account is always present in users list
    let users = collectionsData.users || [];
    if (!users.some(u => u.id === INITIAL_EMPTY_STATE.users[0].id)) {
      users = [INITIAL_EMPTY_STATE.users[0], ...users];
    }

    // Ensure at least default location exists if empty
    let locations = collectionsData.locations || [];
    if (locations.length === 0) {
      locations = DEFAULT_BIMBEL_LOCATIONS;
    }

    // If all collections are empty, trigger initial seed
    const isEmpty = 
      (collectionsData.users?.length || 0) === 0 &&
      (collectionsData.students?.length || 0) === 0 &&
      (collectionsData.attendance?.length || 0) === 0 &&
      (collectionsData.teacherAttendance?.length || 0) === 0 &&
      (collectionsData.assessments?.length || 0) === 0 &&
      (collectionsData.activities?.length || 0) === 0 &&
      (collectionsData.chats?.length || 0) === 0 &&
      (collectionsData.invoices?.length || 0) === 0 &&
      (collectionsData.schedules?.length || 0) === 0 &&
      (collectionsData.broadcasts?.length || 0) === 0;

    if (isEmpty && !hasSeeded) {
      hasSeeded = true;
      try {
        await seedInitialFirestoreData();
      } catch (err) {
        console.warn('Seeding failed or offline:', err);
      }
    }

    const assembledState: BimbelState = {
      users,
      students: collectionsData.students || [],
      attendance: collectionsData.attendance || [],
      teacherAttendance: collectionsData.teacherAttendance || [],
      assessments: collectionsData.assessments || [],
      activities: collectionsData.activities || [],
      chats: collectionsData.chats || [],
      invoices: collectionsData.invoices || [],
      schedules: collectionsData.schedules || [],
      broadcasts: collectionsData.broadcasts || [],
      bankAccount: collectionsData.bankAccount || DEFAULT_BANK_ACCOUNT,
      locations,
      activeLocationId: collectionsData.activeLocationId || locations.find(l => l.isDefault)?.id || locations[0]?.id || 'loc-pusat',
    };

    const { state: sanitizedState, hasChanges } = sanitizeBimbelState(assembledState);

    if (hasChanges) {
      // Sync corrected items to Firestore asynchronously
      syncStateToFirestore(sanitizedState).catch(err => {
        console.warn('Auto-sync of sanitized state failed:', err);
      });
    }

    onUpdate(sanitizedState);
  };

  const handleListenerError = (err: unknown) => {
    console.warn('Firestore snapshot listener warning:', err);
    onStatusChange(false);
  };

  const unsubscribes = [
    onSnapshot(doc(db, 'settings', 'bankAccount'), docSnap => {
      if (docSnap.exists()) {
        collectionsData.bankAccount = docSnap.data() as BankAccountInfo;
        checkAndEmit();
      }
    }, handleListenerError),

    onSnapshot(collection(db, 'locations'), snap => {
      if (!snap.empty) {
        collectionsData.locations = snap.docs.map(d => d.data() as BimbelLocation);
        checkAndEmit();
      }
    }, handleListenerError),

    onSnapshot(collection(db, 'users'), snap => {
      collectionsData.users = snap.docs.map(d => d.data() as UserAccount);
      checkAndEmit();
    }, handleListenerError),

    onSnapshot(collection(db, 'students'), snap => {
      collectionsData.students = snap.docs.map(d => d.data() as Student);
      onStatusChange(true);
      checkAndEmit();
    }, handleListenerError),

    onSnapshot(collection(db, 'attendance'), snap => {
      collectionsData.attendance = snap.docs.map(d => d.data() as Attendance);
      checkAndEmit();
    }, handleListenerError),

    onSnapshot(collection(db, 'teacherAttendance'), snap => {
      collectionsData.teacherAttendance = snap.docs.map(d => d.data() as TeacherAttendance);
      checkAndEmit();
    }, handleListenerError),

    onSnapshot(collection(db, 'assessments'), snap => {
      collectionsData.assessments = snap.docs.map(d => d.data() as Assessment);
      checkAndEmit();
    }, handleListenerError),

    onSnapshot(collection(db, 'activities'), snap => {
      const items = snap.docs.map(d => d.data() as DailyActivity);
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      collectionsData.activities = items;
      checkAndEmit();
    }, handleListenerError),

    onSnapshot(collection(db, 'chats'), snap => {
      const items = snap.docs.map(d => d.data() as ChatMessage);
      items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      collectionsData.chats = items;
      checkAndEmit();
    }, handleListenerError),

    onSnapshot(collection(db, 'invoices'), snap => {
      collectionsData.invoices = snap.docs.map(d => d.data() as Invoice);
      checkAndEmit();
    }, handleListenerError),

    onSnapshot(collection(db, 'schedules'), snap => {
      collectionsData.schedules = snap.docs.map(d => d.data() as ScheduleItem);
      checkAndEmit();
    }, handleListenerError),

    onSnapshot(collection(db, 'broadcasts'), snap => {
      const items = snap.docs.map(d => d.data() as BroadcastMessage);
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      collectionsData.broadcasts = items;
      checkAndEmit();
    }, handleListenerError),
  ];

  return () => {
    unsubscribes.forEach(unsub => unsub());
  };
}

