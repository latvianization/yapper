class UserModel {
  final String uid;
  final String email;
  final String displayName;
  final String photoUrl;
  final String status; // online, busy, away, offline
  final String role; // owner, admin, member
  final String companyId;
  final String companyName;

  const UserModel({
    required this.uid,
    required this.email,
    required this.displayName,
    this.photoUrl = '',
    this.status = 'online',
    this.role = 'member',
    this.companyId = 'comp_default',
    this.companyName = 'Yapper HQ',
  });

  UserModel copyWith({
    String? uid,
    String? email,
    String? displayName,
    String? photoUrl,
    String? status,
    String? role,
    String? companyId,
    String? companyName,
  }) {
    return UserModel(
      uid: uid ?? this.uid,
      email: email ?? this.email,
      displayName: displayName ?? this.displayName,
      photoUrl: photoUrl ?? this.photoUrl,
      status: status ?? this.status,
      role: role ?? this.role,
      companyId: companyId ?? this.companyId,
      companyName: companyName ?? this.companyName,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'uid': uid,
      'email': email,
      'displayName': displayName,
      'photoUrl': photoUrl,
      'status': status,
      'role': role,
      'companyId': companyId,
      'companyName': companyName,
    };
  }

  factory UserModel.fromJson(Map<String, dynamic> map) {
    return UserModel(
      uid: map['uid'] as String? ?? '',
      email: map['email'] as String? ?? '',
      displayName: map['displayName'] as String? ?? 'User',
      photoUrl: map['photoUrl'] as String? ?? '',
      status: map['status'] as String? ?? 'online',
      role: map['role'] as String? ?? 'member',
      companyId: map['companyId'] as String? ?? 'comp_default',
      companyName: map['companyName'] as String? ?? 'Yapper HQ',
    );
  }
}
