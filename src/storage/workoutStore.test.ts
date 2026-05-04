import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  addHandledNotificationActionId,
  hasHandledNotificationActionId,
  loadAppState,
} from "./workoutStore";

jest.mock(
  "@react-native-async-storage/async-storage",
  () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

describe("workoutStore notification action ids", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test("stores handled notification action ids once", async () => {
    const actionId = "rest_done_session-test_0_2:FINISH_SET_ACTION";

    await expect(hasHandledNotificationActionId(actionId)).resolves.toBe(false);

    await addHandledNotificationActionId(actionId);
    await addHandledNotificationActionId(actionId);

    await expect(hasHandledNotificationActionId(actionId)).resolves.toBe(true);

    const state = await loadAppState();
    expect(state.handledNotificationActionIds).toEqual([actionId]);
  });
});
