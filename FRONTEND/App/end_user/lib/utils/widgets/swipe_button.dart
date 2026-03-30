import 'package:flutter/material.dart';

enum SwipeDirection { left, right }

class SwipeButton extends StatefulWidget {
  final VoidCallback onSwipe;
  final String label;
  final IconData icon;
  final Color activeColor;
  final bool isEnabled;
  final String? disabledLabel;
  final SwipeDirection direction;

  const SwipeButton({
    super.key,
    required this.onSwipe,
    required this.label,
    required this.icon,
    required this.activeColor,
    this.isEnabled = true,
    this.disabledLabel,
    this.direction = SwipeDirection.right,
  });

  @override
  State<SwipeButton> createState() => _SwipeButtonState();
}

class _SwipeButtonState extends State<SwipeButton> with SingleTickerProviderStateMixin {
  double _progress = 0.0; // 0.0 to 1.0
  bool _isSwiped = false;
  final double _height = 64.0;
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
    _resetState();
  }

  void _resetState() {
    if (mounted) {
      setState(() {
        _progress = 0.0;
        _isSwiped = false;
      });
    }
  }

  @override
  void didUpdateWidget(SwipeButton oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.direction != widget.direction) {
      _resetState();
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final totalWidth = constraints.maxWidth;
        const double margin = 4.0;
        final thumbSize = _height - 8.0;
        final maxDragDistance = totalWidth - (margin * 2) - thumbSize;

        return Container(
          height: _height,
          width: totalWidth,
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(
            color: widget.isEnabled 
                ? widget.activeColor.withOpacity(0.08)
                : Colors.grey.shade100,
            borderRadius: BorderRadius.circular(_height / 2),
            border: Border.all(
              color: widget.isEnabled 
                  ? widget.activeColor.withOpacity(0.12)
                  : Colors.grey.shade300,
              width: 1.0,
            ),
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Progress track fill
              Positioned(
                left: widget.direction == SwipeDirection.right ? margin : null,
                right: widget.direction == SwipeDirection.left ? margin : null,
                child: Container(
                  height: thumbSize,
                  width: (thumbSize + (_progress * maxDragDistance)).clamp(thumbSize, totalWidth - (margin * 2)),
                  decoration: BoxDecoration(
                    color: widget.activeColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(thumbSize / 2),
                  ),
                ),
              ),

              // Label text
              Opacity(
                opacity: (1.0 - (_progress * 1.5)).clamp(0.0, 1.0),
                child: Text(
                  widget.isEnabled ? widget.label.toUpperCase() : (widget.disabledLabel?.toUpperCase() ?? 'OFFLINE'),
                  style: TextStyle(
                    color: widget.isEnabled ? widget.activeColor.withOpacity(0.7) : Colors.grey,
                    fontWeight: FontWeight.w900,
                    fontSize: 12,
                    letterSpacing: 0.8,
                  ),
                ),
              ),

              // Animated Chevrons
              if (!_isSwiped && widget.isEnabled)
                Positioned(
                  left: widget.direction == SwipeDirection.right ? totalWidth * 0.38 : null,
                  right: widget.direction == SwipeDirection.left ? totalWidth * 0.38 : null,
                  child: FadeTransition(
                    opacity: _pulseController,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: List.generate(2, (index) => Icon(
                        widget.direction == SwipeDirection.right ? Icons.chevron_right_rounded : Icons.chevron_left_rounded,
                        color: widget.activeColor.withOpacity(0.2),
                        size: 18,
                      )),
                    ),
                  ),
                ),

              // Thumb
              Positioned(
                left: widget.direction == SwipeDirection.right ? (margin + (_progress * maxDragDistance)) : null,
                right: widget.direction == SwipeDirection.left ? (margin + (_progress * maxDragDistance)) : null,
                child: GestureDetector(
                  onHorizontalDragUpdate: (details) {
                    if (!widget.isEnabled || _isSwiped) return;
                    
                    final delta = details.primaryDelta ?? 0;
                    final move = widget.direction == SwipeDirection.right ? delta : -delta;
                    
                    setState(() {
                      _progress = (_progress + (move / maxDragDistance)).clamp(0.0, 1.0);
                    });
                  },
                  onHorizontalDragEnd: (details) {
                    if (!widget.isEnabled || _isSwiped) return;

                    if (_progress > 0.75) {
                      setState(() {
                        _progress = 1.0;
                        _isSwiped = true;
                      });
                      widget.onSwipe();
                      
                      Future.delayed(const Duration(seconds: 2), () {
                        _resetState();
                      });
                    } else {
                      setState(() {
                        _progress = 0.0;
                      });
                    }
                  },
                  child: Container(
                    width: thumbSize,
                    height: thumbSize,
                    decoration: BoxDecoration(
                      color: widget.isEnabled ? widget.activeColor : Colors.grey.shade400,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: (widget.isEnabled ? widget.activeColor : Colors.black).withOpacity(0.3),
                          blurRadius: 4,
                          offset: const Offset(0, 1),
                        ),
                      ],
                    ),
                    child: Center(
                      child: Icon(
                        _isSwiped ? Icons.check_rounded : widget.icon,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
