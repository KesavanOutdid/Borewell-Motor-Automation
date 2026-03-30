class HelpModel {
  final String? id;
  final int userId;
  final String userName;
  final String userMobile;
  final String subject;
  final String description;
  final String status;
  final String? createdBy;
  final DateTime? createdAt;
  final String? updatedBy;
  final DateTime? updatedAt;

  HelpModel({
    this.id,
    required this.userId,
    required this.userName,
    required this.userMobile,
    required this.subject,
    required this.description,
    required this.status,
    this.createdBy,
    this.createdAt,
    this.updatedBy,
    this.updatedAt,
  });

  factory HelpModel.fromJson(Map<String, dynamic> json) {
    return HelpModel(
      id: json['_id'],
      userId: json['user_id'],
      userName: json['user_name'] ?? "",
      userMobile: json['user_mobile'] ?? "",
      subject: json['subject'] ?? "",
      description: json['description'] ?? "",
      status: json['status'] ?? "pending",
      createdBy: json['createdBy'],
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      updatedBy: json['updatedBy'],
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user_id': userId,
      'user_name': userName,
      'user_mobile': userMobile,
      'subject': subject,
      'description': description,
      'status': status,
      'createdBy': createdBy,
    };
  }
}
