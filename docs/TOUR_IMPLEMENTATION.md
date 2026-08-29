# App Tour Implementation

## Overview

The app uses [`tutorial_coach_mark`](https://pub.dev/packages/tutorial_coach_mark) to show guided onboarding tours. Tours are shown **once per install** (state persisted via `GetStorage`). Each page has its own independent tour with its own storage key.

The entire tour UI is centralized in a single file:

**`lib/core/services/tour_service.dart`**

---

## Architecture

### `TourService` (GetxService)

Registered globally via `Get.put` / `Get.find`.

| Responsibility | Details |
|---|---|
| Store `GlobalKey` refs for every highlighted widget | Organized by page |
| Store tour step definitions (`_TourStep` list) | Statically defined per page |
| Expose `showXxxTour(context)` methods | Called from each page's `build` or `initState` |
| Persist completion state | `GetStorage` key per tour |
| `resetTour()` | Resets all tours (used from Profile page) |
| `resetXxxTour()` | Resets a single tour |

### `_TourCard` (private StatelessWidget)

The unified card UI rendered for every tour step on every page. Features:

- **Deep green gradient card** (`#064E3B → #065F46`)
- **Per-step icon** in a frosted glass badge
- **Title** + **"Step X of Y"** subtitle
- **Gradient divider** line
- **Description text** with comfortable line height
- **Animated progress dots** (active dot expands to pill shape)
- **Skip button** (ghost style, hidden on last step)
- **Next / Got it! button** (green gradient with arrow / checkmark icon)

---

## Pages Covered

### 1. Home Page — 4 steps

**File:** `lib/feature/end_user_app/home/presentation/pages/home_page.dart`  
**Trigger:** `WidgetsBinding.instance.addPostFrameCallback` in `build()`  
**Storage key:** `home_tour_completed`

| Step | Key | Widget | Description shown |
|---|---|---|---|
| 1 | `menuKey` | Hamburger menu button | Opens drawer |
| 2 | `notificationsKey` | Bell icon button | Motor alerts |
| 3 | `filterKey` | Filter chips row | Status filters |
| 4 | `addDeviceKey` | Add device FAB | QR scan to add |

---

### 2. Device Details Page — 4 steps

**File:** `lib/feature/end_user_app/device/presentation/pages/device_details_page.dart`  
**Trigger:** `WidgetsBinding.instance.addPostFrameCallback` in `build()`  
**Storage key:** `details_tour_completed`

| Step | Key | Widget | Description shown |
|---|---|---|---|
| 1 | `deviceStatusCardKey` | Device placement card | Running / Online / Offline status |
| 2 | `quickActionsKey` | Quick actions row | History, Analytics, Access, Schedule |
| 3 | `liveDataKey` | Live readings grid | Voltage, current, temperature |
| 4 | `motorControlKey` | Swipe control card | Start / stop motor |

All widgets are wrapped with `KeyedSubtree` at the `build()` call site so the `GlobalKey` attaches without changing method signatures.

---

### 3. Scheduler Page — 2 steps

**File:** `lib/feature/end_user_app/device/presentation/pages/device_schedule_page.dart`  
**Trigger:** `WidgetsBinding.instance.addPostFrameCallback` inside `initState()`  
**Storage key:** `schedule_tour_completed`

| Step | Key | Widget | Description shown |
|---|---|---|---|
| 1 | `scheduleFormKey` | Schedule form card | Start & stop date/time pickers |
| 2 | `scheduleListKey` | "Active/Past Schedules" header | Review & cancel schedules |

---

### 4. Device Sharing (Access) Page — 2 steps

**File:** `lib/feature/end_user_app/device/presentation/pages/device_sharing_page.dart`  
**Trigger:** `WidgetsBinding.instance.addPostFrameCallback` in `build()`  
**Storage key:** `sharing_tour_completed`

| Step | Key | Widget | Description shown |
|---|---|---|---|
| 1 | `shareAddSectionKey` | Add access column (title + description + phone input + button) | Grant access by phone number |
| 2 | `sharedUsersListKey` | "Access Granted" header | Who has access, toggle / remove |

---

## Translation Keys

All keys exist in **both `en_US` and `hi_IN`** inside `lib/core/localization/app_translations.dart`.

### Home Tour
| Key | English |
|---|---|
| `tour_menu_title` | Main Menu |
| `tour_menu_desc` | Open drawer to access profile, settings and more |
| `tour_notifications_title` | Notifications |
| `tour_notifications_desc` | Stay updated with motor alerts and status changes |
| `tour_filter_title` | Quick Filters |
| `tour_filter_desc` | Filter devices by status like Running or Offline |
| `tour_add_device_title` | Add New Device |
| `tour_add_device_desc` | Scan QR code to add a new motor controller to your account |

### Device Details Tour
| Key | English |
|---|---|
| `tour_detail_status_title` | Device Status |
| `tour_detail_status_desc` | See if your motor is Running, Online, or Offline at a glance. The banner updates in real time. |
| `tour_detail_actions_title` | Quick Actions |
| `tour_detail_actions_desc` | Jump to History, Analytics, Schedule or share Access — all in one tap from here. |
| `tour_detail_live_title` | Live Readings |
| `tour_detail_live_desc` | Real-time sensor data like voltage, current and temperature streamed directly from your device. |
| `tour_detail_control_title` | Motor Control |
| `tour_detail_control_desc` | Swipe the button to start or stop your motor. Works only when the device is online. |

### Scheduler Tour
| Key | English |
|---|---|
| `tour_schedule_form_title` | Set a Schedule |
| `tour_schedule_form_desc` | Pick a start and stop date & time. The motor will turn on and off automatically — no manual action needed. |
| `tour_schedule_list_title` | Active & Past Schedules |
| `tour_schedule_list_desc` | Review all your upcoming and completed schedules here. You can cancel any active schedule anytime. |

### Sharing Tour
| Key | English |
|---|---|
| `tour_share_add_title` | Grant Access |
| `tour_share_add_desc` | Enter a 10-digit phone number to give someone control of this device. They can start, stop and view live readings. |
| `tour_share_users_title` | Who Has Access |
| `tour_share_users_desc` | Up to 3 people can share this device. Use the toggle to enable or disable their access anytime. |

---

## How to Add a New Tour (for future pages)

1. **Add `GlobalKey` fields** to `TourService` for each widget to highlight
2. **Add a `_TourStep` list** (static const) with icon, title/desc translation keys, align, and stepIndex
3. **Add a `showXxxTour(context)` method** that calls `_show(context, steps, keys, storageKey)`
4. **Add a `resetXxxTour()` method**
5. **In the page**, call `Get.find<TourService>().showXxxTour(context)` inside `addPostFrameCallback`
6. **Wrap target widgets** with `KeyedSubtree(key: tourService.yourKey, child: ...)`
7. **Add translation strings** in both `en_US` and `hi_IN` in `app_translations.dart`

---

## Resetting Tours (for testing)

From `Profile Page` there is a "Replay Tour" option that calls `tourService.resetTour()` which resets **all** tours at once. Individual resets are also available:

```dart
tourService.resetHomeTour();
tourService.resetDetailsTour();
tourService.resetScheduleTour();
tourService.resetSharingTour();
```

---

## Files Changed

| File | Change |
|---|---|
| `lib/core/services/tour_service.dart` | Full rewrite — central hub for all tours |
| `lib/feature/end_user_app/home/presentation/pages/home_page.dart` | Already had tour trigger (no change needed) |
| `lib/feature/end_user_app/device/presentation/pages/device_details_page.dart` | Added import, trigger, 4× `KeyedSubtree` |
| `lib/feature/end_user_app/device/presentation/pages/device_schedule_page.dart` | Added import, trigger in `initState`, 2× `KeyedSubtree` |
| `lib/feature/end_user_app/device/presentation/pages/device_sharing_page.dart` | Added import, trigger, restructured add section into Column + 2× `KeyedSubtree` |
| `lib/core/localization/app_translations.dart` | Added 16 new keys in both `en_US` and `hi_IN` |
