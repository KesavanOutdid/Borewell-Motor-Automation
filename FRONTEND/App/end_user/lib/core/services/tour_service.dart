import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:tutorial_coach_mark/tutorial_coach_mark.dart';
import '../../utils/theme/app_colors.dart';

class TourService extends GetxService {
  final _storage = GetStorage();

  static const String _homeTourKey = 'home_tour_completed';
  static const String _detailsTourKey = 'details_tour_completed';
  static const String _scheduleTourKey = 'schedule_tour_completed';
  static const String _sharingTourKey = 'sharing_tour_completed';

  late TutorialCoachMark tutorialCoachMark;

  // ── Home Page keys ──────────────────────────────────────────────────────────
  final GlobalKey menuKey = GlobalKey();
  final GlobalKey notificationsKey = GlobalKey();
  final GlobalKey filterKey = GlobalKey();
  final GlobalKey addDeviceKey = GlobalKey();

  // ── Device Details Page keys ────────────────────────────────────────────────
  final GlobalKey deviceStatusCardKey = GlobalKey();
  final GlobalKey quickActionsKey = GlobalKey();
  final GlobalKey liveDataKey = GlobalKey();
  final GlobalKey motorControlKey = GlobalKey();

  // ── Schedule Page keys ──────────────────────────────────────────────────────
  final GlobalKey scheduleFormKey = GlobalKey();
  final GlobalKey scheduleListKey = GlobalKey();

  // ── Sharing Page keys ───────────────────────────────────────────────────────
  final GlobalKey shareAddSectionKey = GlobalKey();
  final GlobalKey sharedUsersListKey = GlobalKey();

  // ── Home Tour ───────────────────────────────────────────────────────────────
  static const List<_TourStep> _homeSteps = [
    _TourStep(id: 'menu', icon: Icons.menu_rounded, titleKey: 'tour_menu_title', descKey: 'tour_menu_desc', align: ContentAlign.bottom, stepIndex: 0),
    _TourStep(id: 'notifications', icon: Icons.notifications_rounded, titleKey: 'tour_notifications_title', descKey: 'tour_notifications_desc', align: ContentAlign.bottom, stepIndex: 1),
    _TourStep(id: 'filters', icon: Icons.filter_list_rounded, titleKey: 'tour_filter_title', descKey: 'tour_filter_desc', align: ContentAlign.bottom, stepIndex: 2),
    _TourStep(id: 'addDevice', icon: Icons.qr_code_scanner_rounded, titleKey: 'tour_add_device_title', descKey: 'tour_add_device_desc', align: ContentAlign.top, stepIndex: 3),
  ];

  void showHomeTour(BuildContext context) {
    if (_storage.read(_homeTourKey) == true) return;
    final keys = [menuKey, notificationsKey, filterKey, addDeviceKey];
    _show(context, _homeSteps, keys, _homeTourKey);
  }

  // ── Device Details Tour ─────────────────────────────────────────────────────
  static const List<_TourStep> _detailsSteps = [
    _TourStep(id: 'deviceStatus', icon: Icons.info_rounded, titleKey: 'tour_detail_status_title', descKey: 'tour_detail_status_desc', align: ContentAlign.bottom, stepIndex: 0),
    _TourStep(id: 'quickActions', icon: Icons.apps_rounded, titleKey: 'tour_detail_actions_title', descKey: 'tour_detail_actions_desc', align: ContentAlign.bottom, stepIndex: 1),
    _TourStep(id: 'liveData', icon: Icons.sensors_rounded, titleKey: 'tour_detail_live_title', descKey: 'tour_detail_live_desc', align: ContentAlign.top, stepIndex: 2),
    _TourStep(id: 'motorControl', icon: Icons.power_settings_new_rounded, titleKey: 'tour_detail_control_title', descKey: 'tour_detail_control_desc', align: ContentAlign.top, stepIndex: 3),
  ];

  void showDeviceDetailsTour(BuildContext context) {
    if (_storage.read(_detailsTourKey) == true) return;
    final keys = [deviceStatusCardKey, quickActionsKey, liveDataKey, motorControlKey];
    _show(context, _detailsSteps, keys, _detailsTourKey);
  }

  // ── Schedule Tour ───────────────────────────────────────────────────────────
  static const List<_TourStep> _scheduleSteps = [
    _TourStep(id: 'scheduleForm', icon: Icons.edit_calendar_rounded, titleKey: 'tour_schedule_form_title', descKey: 'tour_schedule_form_desc', align: ContentAlign.bottom, stepIndex: 0),
    _TourStep(id: 'scheduleList', icon: Icons.list_alt_rounded, titleKey: 'tour_schedule_list_title', descKey: 'tour_schedule_list_desc', align: ContentAlign.top, stepIndex: 1),
  ];

  void showScheduleTour(BuildContext context) {
    if (_storage.read(_scheduleTourKey) == true) return;
    final keys = [scheduleFormKey, scheduleListKey];
    _show(context, _scheduleSteps, keys, _scheduleTourKey);
  }

  // ── Sharing Tour ────────────────────────────────────────────────────────────
  static const List<_TourStep> _sharingSteps = [
    _TourStep(id: 'shareAdd', icon: Icons.person_add_rounded, titleKey: 'tour_share_add_title', descKey: 'tour_share_add_desc', align: ContentAlign.bottom, stepIndex: 0),
    _TourStep(id: 'sharedUsers', icon: Icons.group_rounded, titleKey: 'tour_share_users_title', descKey: 'tour_share_users_desc', align: ContentAlign.top, stepIndex: 1),
  ];

  void showSharingTour(BuildContext context) {
    if (_storage.read(_sharingTourKey) == true) return;
    final keys = [shareAddSectionKey, sharedUsersListKey];
    _show(context, _sharingSteps, keys, _sharingTourKey);
  }

  // ── Reset ───────────────────────────────────────────────────────────────────
  void resetTour() {
    _storage.write(_homeTourKey, false);
    _storage.write(_detailsTourKey, false);
    _storage.write(_scheduleTourKey, false);
    _storage.write(_sharingTourKey, false);
  }

  void resetHomeTour() => _storage.write(_homeTourKey, false);
  void resetDetailsTour() => _storage.write(_detailsTourKey, false);
  void resetScheduleTour() => _storage.write(_scheduleTourKey, false);
  void resetSharingTour() => _storage.write(_sharingTourKey, false);

  // ── Internal helper ─────────────────────────────────────────────────────────
  void _show(
    BuildContext context,
    List<_TourStep> steps,
    List<GlobalKey> keys,
    String storageKey,
  ) {
    // Filter out targets where the widget is not yet mounted in the tree
    final List<_TourStep> validSteps = [];
    final List<GlobalKey> validKeys = [];
    for (int i = 0; i < steps.length; i++) {
      final key = keys[i];
      if (key.currentContext == null) {
        print('⚠️ [Tour] Skipping step "${steps[i].id}" — widget not mounted');
        continue;
      }
      validSteps.add(steps[i]);
      validKeys.add(key);
    }

    final validTotal = validSteps.length;

    final List<TargetFocus> targets = [];
    for (int i = 0; i < validSteps.length; i++) {
      final step = validSteps[i];
      final key = validKeys[i];
      // Create a re-indexed step so the card shows correct sequential numbering
      final reindexedStep = _TourStep(
        id: step.id,
        icon: step.icon,
        titleKey: step.titleKey,
        descKey: step.descKey,
        align: step.align,
        stepIndex: i,
      );
      targets.add(TargetFocus(
        identify: step.id,
        keyTarget: key,
        shape: ShapeLightFocus.RRect,
        radius: 16,
        contents: [
          TargetContent(
            align: step.align,
            builder: (context, controller) => _TourCard(
              step: reindexedStep,
              total: validTotal,
              onNext: () {
                if (i + 1 < validKeys.length) {
                  final nextKey = validKeys[i + 1];
                  if (nextKey.currentContext != null) {
                    Scrollable.ensureVisible(
                      nextKey.currentContext!,
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeInOut,
                      alignment: 0.5,
                    ).then((_) {
                      controller.next();
                    });
                    return;
                  }
                }
                controller.next();
              },
              onSkip: () => controller.skip(),
            ),
          ),
        ],
      ));
    }

    if (targets.isEmpty) {
      print('⚠️ [Tour] No valid targets found — skipping tour for "$storageKey"');
      return;
    }

    print('✅ [Tour] Showing tour "$storageKey" with ${targets.length}/${steps.length} targets');

    void showTour() {
      tutorialCoachMark = TutorialCoachMark(
        targets: targets,
        colorShadow: const Color(0xFF000000),
        opacityShadow: 0.85,
        paddingFocus: 12,
        focusAnimationDuration: const Duration(milliseconds: 400),
        pulseAnimationDuration: const Duration(milliseconds: 800),
        onFinish: () => _storage.write(storageKey, true),
        onSkip: () {
          _storage.write(storageKey, true);
          return true;
        },
      )..show(context: context);
    }

    if (validKeys.first.currentContext != null) {
      Scrollable.ensureVisible(
        validKeys.first.currentContext!,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
        alignment: 0.5,
      ).then((_) {
        if (context.mounted) showTour();
      });
    } else {
      showTour();
    }
  }
}

// ── Data model ────────────────────────────────────────────────────────────────

class _TourStep {
  final String id;
  final IconData icon;
  final String titleKey;
  final String descKey;
  final ContentAlign align;
  final int stepIndex;

  const _TourStep({
    required this.id,
    required this.icon,
    required this.titleKey,
    required this.descKey,
    required this.align,
    required this.stepIndex,
  });
}

// ── Tour Card Widget ──────────────────────────────────────────────────────────

class _TourCard extends StatelessWidget {
  final _TourStep step;
  final int total;
  final VoidCallback onNext;
  final VoidCallback onSkip;

  const _TourCard({
    required this.step,
    required this.total,
    required this.onNext,
    required this.onSkip,
  });

  bool get _isLast => step.stepIndex == total - 1;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: Container(
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF064E3B), Color(0xFF065F46)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: AppColors.primaryGreen.withValues(alpha: 0.45),
              blurRadius: 32,
              offset: const Offset(0, 12),
              spreadRadius: -4,
            ),
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.3),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
          border: Border.all(
            color: AppColors.lightGreen.withValues(alpha: 0.25),
            width: 1,
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            _buildBody(),
            _buildFooter(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.lightGreen.withValues(alpha: 0.3),
                  AppColors.emerald.withValues(alpha: 0.15),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: AppColors.emerald.withValues(alpha: 0.4),
                width: 1,
              ),
            ),
            child: Icon(step.icon, color: AppColors.emerald, size: 26),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  step.titleKey.tr,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.3,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  'Step ${step.stepIndex + 1} of $total',
                  style: TextStyle(
                    color: AppColors.emerald.withValues(alpha: 0.8),
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 1,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [AppColors.emerald.withValues(alpha: 0.4), Colors.transparent],
              ),
            ),
          ),
          const SizedBox(height: 14),
          Text(
            step.descKey.tr,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.85),
              fontSize: 14.5,
              height: 1.55,
              fontWeight: FontWeight.w400,
              letterSpacing: 0.1,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFooter() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
      child: Row(
        children: [
          _buildProgressDots(),
          const Spacer(),
          if (!_isLast) ...[
            _buildSkipButton(),
            const SizedBox(width: 10),
          ],
          _buildActionButton(),
        ],
      ),
    );
  }

  Widget _buildProgressDots() {
    return Row(
      children: List.generate(total, (i) {
        final isActive = i == step.stepIndex;
        final isPast = i < step.stepIndex;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
          margin: const EdgeInsets.only(right: 6),
          width: isActive ? 22 : 8,
          height: 8,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(4),
            color: isActive
                ? AppColors.emerald
                : isPast
                    ? AppColors.emerald.withValues(alpha: 0.45)
                    : Colors.white.withValues(alpha: 0.2),
          ),
        );
      }),
    );
  }

  Widget _buildSkipButton() {
    return GestureDetector(
      onTap: onSkip,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withValues(alpha: 0.12), width: 1),
        ),
        child: Text(
          'Skip',
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.6),
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  Widget _buildActionButton() {
    return GestureDetector(
      onTap: onNext,
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: _isLast ? 20 : 16, vertical: 9),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [AppColors.lightGreen, AppColors.primaryGreen],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: AppColors.primaryGreen.withValues(alpha: 0.5),
              blurRadius: 12,
              offset: const Offset(0, 4),
              spreadRadius: -2,
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              _isLast ? 'Got it!' : 'Next',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.2,
              ),
            ),
            const SizedBox(width: 6),
            Icon(
              _isLast ? Icons.check_circle_rounded : Icons.arrow_forward_rounded,
              color: Colors.white,
              size: 16,
            ),
          ],
        ),
      ),
    );
  }
}
