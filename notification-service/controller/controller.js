const admin = require("../services/firebase");
const now = new Date();
const {formatDistanceToNow} = require('date-fns');
const cron = require('node-cron');
// Replace this with your actual DB logic
async function getTokenForProject(projectId) {
    // For demo, return a hardcoded token or retrieve from DB
    return 'fXrfTx4pePGnqo6_8ImYg5:APA91bEQmErZcuBd8uBf24nc7Nsl2A1j9Ej5MOcI7Tw-QBUb6EK1BXSlyns0wIn5PmDfTzl7rk31kGzTqj2go8lnmBhkLF1M1FDSGcVQCNssOZWRq-hW2PY';
}

async function logNotificationToFirestore(routingKey, message) {
  const db = admin.firestore();
  await db.collection("notification_service").add({
    routingKey,
    title: message.notification.title,
    body: message.notification.body,
    data: message.data,
    token: message.token,
    sentAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}
async function handleMessage(routingKey, data) {
    const db = admin.firestore();

    switch (routingKey) {
        case 'event.project.task.created':
            const taskList = data.payload['project_task'];
            const task = taskList[taskList.length - 1];
            const Id = task.task_id || task.data?.task_id || task.componentCode;
            const description = task.work_description || task.data?.work_description;
            const projectId = data.payload['project_id'];

            console.log(`✔️ Task created:`, task);

            if (Id && description) {
                const token = await getTokenForProject(projectId);
                if (!token) {
                    console.warn('⚠️ No FCM token found for project:', projectId);
                    return;
                }

                const message = {
                    notification: {
                        title: '🆕 New Task Created' + " " + formatDistanceToNow(now, {addSuffix: true}),
                        body: description,
                    },
                    data: {
                        taskId: Id,
                        projectId: projectId,
                        createdAt: formatDistanceToNow(now, { addSuffix: true }),
                    },
                    token,
                };

                try {
                    const response = await admin.messaging().send(message);
                    console.log('📲 Notification sent:', response);
                    await logNotificationToFirestore("done", message);
                } catch (err) {
                    console.error('❌ Failed to send notification:', err);
                }
            } else {
                console.warn('⚠️ Missing ID or description in task payload.');
            }
            break;

        // You can add more handlers here
        case 'event.project.task.updated':
            const updatedTaskList = data.payload['data']['project_task'];
            const updatedTask = updatedTaskList[updatedTaskList.length - 1];
            const updatedId = updatedTask.task_id || updatedTask.data?.task_id || updatedTask.componentCode;
            const updatedDescription = updatedTask.work_description || updatedTask.data?.work_description;
            const updatedProjectId = data.payload['projectId'];

            console.log(`✔️ Task updated:`, updatedTask);

            if (updatedId && updatedDescription) {
                const token = await getTokenForProject(updatedProjectId);
                if (!token) {
                    console.warn('⚠️ No FCM token found for project:', updatedProjectId);
                    return;
                }

                const message = {
                    notification: {
                        title: '🔄 Task Updated' + " " + formatDistanceToNow(now, {addSuffix: true}),
                        body: updatedDescription,
                    },
                    data: {
                        taskId: updatedId,
                        projectId: updatedProjectId,
                        createdAt: formatDistanceToNow(now, { addSuffix: true }),
                    },
                    token,
                };

                try {
                    const response = await admin.messaging().send(message);
                    console.log('📲 Notification sent:', response);
                    await logNotificationToFirestore("done", message);
                } catch (err) {
                    console.error('❌ Failed to send notification:', err);
                }
            } else {
                console.warn('⚠️ Missing ID or description in task payload.');
            }
            break;
        case 'event.project.task.removed':
            const removedTaskId = data.payload['taskId'];
            const removedProjectId = data.payload['projectId'];
            const content = "Task with ID " + removedTaskId + " has been removed from project " + removedProjectId;
            console.log(`✔️ Task removed:`);

            if (removedTaskId) {
                const token = await getTokenForProject(removedProjectId);
                if (!token) {
                    console.warn('⚠️ No FCM token found for project:', removedProjectId);
                    return;
                }

                const message = {
                    notification: {
                        title: '❌ Task Removed' + " " + formatDistanceToNow(now, {addSuffix: true}),
                        body: content,
                    },
                    data: {
                        taskId: removedTaskId,
                        projectId: removedProjectId,
                        createdAt: formatDistanceToNow(now, { addSuffix: true }),
                    },
                    token,
                };

                try {
                    const response = await admin.messaging().send(message);
                    console.log('📲 Notification sent:', response);
                    await logNotificationToFirestore("done", message);
                } catch (err) {
                    console.error('❌ Failed to send notification:', err);
                }
            } else {
                console.warn('⚠️ Missing ID or description in task payload.');
            }
            break;
        case 'event.project.created':
            const projectIdCreated = data.payload['project']['project_id'];
            const projectName = data.payload['project']['project_name'];

            console.log(`✔️ Project created:`, projectName);

            if (projectIdCreated && projectName) {
                const token = await getTokenForProject(projectIdCreated);
                if (!token) {
                    console.warn('⚠️ No FCM token found for project:', projectIdCreated);
                    return;
                }

                const message = {
                    notification: {
                        title: '🆕 New Project Created' + " " + formatDistanceToNow(now, {addSuffix: true}),
                        body: projectName,
                    },
                    data: {
                        projectId: projectIdCreated,
                        createdAt: formatDistanceToNow(now, { addSuffix: true }),
                    },
                    token,
                };

                try {
                    const response = await admin.messaging().send(message);
                    console.log('📲 Notification sent:', response);
                    await logNotificationToFirestore("done", message);
                } catch (err) {
                    console.error('❌ Failed to send notification:', err);
                }
            } else {
                console.warn('⚠️ Missing ID or description in task payload.');
            }
            break;
        case 'event.project.deleted':
            const projectIdDeleted = data.payload['project_id'];
            const projectNameDeleted = data.payload['project_name'];

            console.log(`✔️ Project deleted:`, projectNameDeleted);

            if (projectIdDeleted && projectNameDeleted) {
                const token = await getTokenForProject(projectIdDeleted);
                if (!token) {
                    console.warn('⚠️ No FCM token found for project:', projectIdDeleted);
                    return;
                }

                const message = {
                    notification: {
                        title: '❌ Project Deleted' + " " + formatDistanceToNow(now, {addSuffix: true}),
                        body: projectNameDeleted,
                    },
                    data: {
                        projectId: projectIdDeleted,
                        createdAt: formatDistanceToNow(now, { addSuffix: true }),
                    },
                    token,
                };

                try {
                    const response = await admin.messaging().send(message);
                    console.log('📲 Notification sent:', response);
                    await logNotificationToFirestore("done", message);
                } catch (err) {
                    console.error('❌ Failed to send notification:', err);
                }
            } else {
                console.warn('⚠️ Missing ID or description in task payload.');
            }
            break;
        default:
            console.log(`ℹ️ No handler for routing key: ${routingKey}`);
    }
}
// 🔔 Check due_date in product_service and notify 1 day before
const checkDueDatesAndNotify = async () => {
    const db = admin.firestore();
   try {
    const snapshot = await db.collection('product_service').get();
    const now = new Date();

    for (const doc of snapshot.docs) {
        const data = doc.data();

        // Check project_due (existing logic)
        if (data.project_due) {
            const dueDate = new Date(data.project_due.toDate());
            console.log('Project due date:', dueDate);
            if (dueDate) {
                const timeDiff = dueDate.getTime() - now.getTime();
                if (timeDiff >= 0) {
                    const hoursDiff = timeDiff / (1000 * 60 * 60);
                    if (hoursDiff < 25) {
                        const token = await getTokenForProject(data.project_id);
                        if (!token) {
                            console.warn(`⚠️ No FCM token for project: ${data.project_id}`);
                        } else {
                            const message = {
                                notification: {
                                    title: '⏰ Project Due Tomorrow ' + formatDistanceToNow(now, { addSuffix: true }),
                                    body: `Project "${data.project_name || 'Unnamed Project'}" is due within 24 hours.`,
                                },
                                data: {
                                    
                                    projectId: data.project_id || '',
                                    dueDate: dueDate.toISOString(),
                                },
                                token,
                            };
                            try {
                                const response = await admin.messaging().send(message);
                                console.log(`📲 Project due notification sent for ${doc.id}:`, response);
                                await logNotificationToFirestore("deadline", message);

                            } catch (err) {
                                console.error(`❌ Failed to send project due notification for ${doc.id}:`, err);
                            }
                        }
                    }
                } else {
                    console.log('Project due date has passed:', dueDate);
                }
            }
        }

        // Now check each task's deadline inside project_task
        if (Array.isArray(data.project_task)) {
            for (const task of data.project_task) {
                if (!task.deadline) continue;

                const taskDeadline = new Date(task.deadline.toDate());
                console.log('Task deadline:', taskDeadline);
                if (taskDeadline) {
                    const timeDiff = taskDeadline.getTime() - now.getTime();
                    if (timeDiff >= 0) {
                        const hoursDiff = timeDiff / (1000 * 60 * 60);
                        if (hoursDiff < 25) {
                            const token = await getTokenForProject(data.project_id);
                            if (!token) {
                                console.warn(`⚠️ No FCM token for project: ${data.project_id}`);
                            } else {
                                const message = {
                                    notification: {
                                        title: '⏰ Task Due Tomorrow ' + formatDistanceToNow(now, { addSuffix: true }),
                                        body: `Task "${task.work_description || 'Unnamed Task'}" is due within 24 hours.`,
                                    },
                                    data: {
                                        projectId: data.project_id || '',
                                        taskId: task.id || '',  // if you have a task id field
                                        dueDate: taskDeadline.toISOString(),
                                    },
                                    token,
                                };
                                try {
                                    const response = await admin.messaging().send(message);
                                    console.log(`📲 Task due notification sent for ${doc.id}, task: ${task.name}:`, response);
                                     await logNotificationToFirestore("deadline", message);
                                } catch (err) {
                                    console.error(`❌ Failed to send task due notification for ${doc.id}, task: ${task.name}:`, err);
                                }
                            }
                        }
                    } else {
                        console.log('Task deadline has passed:', taskDeadline);
                    }
                }
            }
        }
    }
} catch (err) {
    console.error('❌ Error while checking due dates and task deadlines:', err);
}
}


// Express route handler version
const getNotifications = async (req, res) => {
  try {
    const db = admin.firestore();
    console.log("Fetching notifications from Firestore...");

    const snapshot = await db.collection('notification_service').orderBy('sentAt', 'desc').get();
    console.log("Fetched notifications:", snapshot.size);

    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title,
      content: doc.data().body,
      type: doc.data().routingKey,
      sendAt: doc.data().sentAt.toDate(),
      projectId: doc.data().data.projectId,
    }));


    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, error: "Failed to fetch notifications" });
  }
};
// 🕒 Schedule to run every day at 9 AM

module.exports = {handleMessage, checkDueDatesAndNotify,getNotifications};

