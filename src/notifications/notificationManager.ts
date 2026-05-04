import * as Notifications from "expo-notifications";

import { ActiveSession, FinishSetNotificationData } from "@/src/models/types";
import {
  addHandledNotificationActionId,
  hasHandledNotificationActionId,
  loadAppState,
  saveAppState,
} from "@/src/storage/workoutStore";
import { handleFinishSetFromNotification } from "@/src/session/sessionEngine";
import { restNotificationIdentifier } from "@/src/utils/ids";

export const REST_DONE_CATEGORY = "REST_DONE_CATEGORY";
export const FINISH_SET_ACTION = "FINISH_SET_ACTION";

let responseSubscription: Notifications.EventSubscription | undefined;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const existingPermissions = await Notifications.getPermissionsAsync();
  const finalPermissions = existingPermissions.granted
    ? existingPermissions
    : await Notifications.requestPermissionsAsync();

  return finalPermissions.granted;
}

export async function registerNotificationCategories(): Promise<void> {
  await Notifications.setNotificationCategoryAsync(REST_DONE_CATEGORY, [
    {
      identifier: FINISH_SET_ACTION,
      buttonTitle: "Finish Set",
      options: {
        opensAppToForeground: false,
        isAuthenticationRequired: false,
      },
    },
  ]);
}

export async function scheduleRestDoneNotification(
  session: ActiveSession,
): Promise<string | undefined> {
  if (
    session.isSuspended ||
    session.phase !== "resting" ||
    !session.restEndsAt ||
    session.nextExerciseIndex === undefined ||
    session.nextSetNumber === undefined
  ) {
    return undefined;
  }

  try {
    await cancelRestNotificationsForSession(session.id);

    const nextExercise = session.workoutSnapshot.exercises[session.nextExerciseIndex];
    if (!nextExercise) {
      return undefined;
    }

    const secondsUntilRestEnd = Math.max(
      1,
      Math.ceil((new Date(session.restEndsAt).getTime() - Date.now()) / 1000),
    );
    const notificationId = restNotificationIdentifier(
      session.id,
      session.nextExerciseIndex,
      session.nextSetNumber,
    );

    const scheduledIdentifier = await Notifications.scheduleNotificationAsync({
      identifier: notificationId,
      content: {
        title: "Beginner Gym Timer",
        body: `Rest done. Next: ${nextExercise.name} Set ${session.nextSetNumber}/${nextExercise.sets}`,
        categoryIdentifier: REST_DONE_CATEGORY,
        data: {
          type: "REST_DONE",
          sessionId: session.id,
          targetExerciseIndex: session.nextExerciseIndex,
          targetSetNumber: session.nextSetNumber,
          notificationId,
        } satisfies FinishSetNotificationData,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntilRestEnd,
        repeats: false,
      },
    });

    return scheduledIdentifier;
  } catch (error) {
    console.warn("Failed to schedule rest notification.", error);
    return undefined;
  }
}

export async function cancelRestNotificationsForSession(sessionId: string): Promise<void> {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const matchingNotifications = scheduledNotifications.filter(
      (notification) => notification.content.data?.sessionId === sessionId,
    );

    await Promise.all(
      matchingNotifications.map((notification) =>
        Notifications.cancelScheduledNotificationAsync(notification.identifier),
      ),
    );
  } catch (error) {
    console.warn("Failed to cancel rest notifications.", error);
  }
}

export async function dismissRestNotificationsForSession(sessionId: string): Promise<void> {
  try {
    const presentedNotifications = await Notifications.getPresentedNotificationsAsync();
    const matchingNotifications = presentedNotifications.filter(
      (notification) => notification.request.content.data?.sessionId === sessionId,
    );

    await Promise.all(
      matchingNotifications.map((notification) =>
        Notifications.dismissNotificationAsync(notification.request.identifier),
      ),
    );
  } catch (error) {
    console.warn("Failed to dismiss rest notifications.", error);
  }
}

export function setupNotificationListeners(): void {
  if (responseSubscription) {
    return;
  }

  responseSubscription =
    Notifications.addNotificationResponseReceivedListener(processNotificationResponse);
}

export async function processNotificationResponse(
  response: Notifications.NotificationResponse,
): Promise<void> {
  if (response.actionIdentifier !== FINISH_SET_ACTION) {
    return;
  }

  const request = response.notification.request;
  const actionKey = `${request.identifier}:${response.actionIdentifier}`;

  if (await hasHandledNotificationActionId(actionKey)) {
    return;
  }

  const notificationData = parseRestDoneNotificationData(request.content.data);
  if (!notificationData) {
    await addHandledNotificationActionId(actionKey);
    return;
  }

  try {
    const state = await loadAppState();
    const activeSession = state.activeSession;

    if (!activeSession || activeSession.id !== notificationData.sessionId) {
      await addHandledNotificationActionId(actionKey);
      return;
    }

    const updatedSession = handleFinishSetFromNotification(
      activeSession,
      notificationData,
      new Date(),
    );

    await saveAppState({
      ...state,
      activeSession: updatedSession,
    });
    await addHandledNotificationActionId(actionKey);

    if (updatedSession?.phase === "resting") {
      await scheduleRestDoneNotification(updatedSession);
    } else if (updatedSession?.phase === "complete") {
      await cancelRestNotificationsForSession(updatedSession.id);
      await dismissRestNotificationsForSession(updatedSession.id);
    }
  } catch (error) {
    console.warn("Failed to process notification action response.", error);
  }
}

export async function processLastNotificationResponseOnStartup(): Promise<void> {
  try {
    const response = Notifications.getLastNotificationResponse();
    if (response) {
      await processNotificationResponse(response);
      Notifications.clearLastNotificationResponse();
    }
  } catch (error) {
    console.warn("Failed to process last notification response.", error);
  }
}

function parseRestDoneNotificationData(
  data: Notifications.NotificationContent["data"],
): FinishSetNotificationData | undefined {
  if (
    data?.type !== "REST_DONE" ||
    typeof data.sessionId !== "string" ||
    typeof data.targetExerciseIndex !== "number" ||
    typeof data.targetSetNumber !== "number" ||
    typeof data.notificationId !== "string"
  ) {
    return undefined;
  }

  return {
    type: "REST_DONE",
    sessionId: data.sessionId,
    targetExerciseIndex: data.targetExerciseIndex,
    targetSetNumber: data.targetSetNumber,
    notificationId: data.notificationId,
  };
}

setupNotificationListeners();
