class CompanyModel {
  final String id;
  final String name;
  final String ownerId;
  final DateTime createdAt;

  const CompanyModel({
    required this.id,
    required this.name,
    required this.ownerId,
    required this.createdAt,
  });

  CompanyModel copyWith({
    String? id,
    String? name,
    String? ownerId,
    DateTime? createdAt,
  }) {
    return CompanyModel(
      id: id ?? this.id,
      name: name ?? this.name,
      ownerId: ownerId ?? this.ownerId,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'ownerId': ownerId,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  factory CompanyModel.fromJson(Map<String, dynamic> map) {
    return CompanyModel(
      id: map['id'] as String? ?? '',
      name: map['name'] as String? ?? 'Workspace',
      ownerId: map['ownerId'] as String? ?? '',
      createdAt: map['createdAt'] != null
          ? DateTime.tryParse(map['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
