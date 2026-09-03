import 'dart:convert';
import 'package:cryptography/cryptography.dart';

class CryptoHelper {
  static final _algorithm = AesGcm.with256bits();
  static final _pbkdf2 = Pbkdf2(
    macAlgorithm: Hmac.sha256(),
    iterations: 100000,
    bits: 256,
  );

  /// Derives an AES-GCM 256-bit SecretKey from a passphrase and salt
  static Future<SecretKey> deriveKey(String password, String salt) async {
    final saltBytes = utf8.encode(salt);
    final secretKey = await _pbkdf2.deriveKey(
      secretKey: SecretKey(utf8.encode(password)),
      nonce: saltBytes,
    );
    return secretKey;
  }

  /// Encrypts plaintext string using AES-GCM 256-bit with random nonce
  static Future<String> encrypt(String plaintext, SecretKey key) async {
    final secretBox = await _algorithm.encrypt(
      utf8.encode(plaintext),
      secretKey: key,
    );
    // Format: nonce:mac:ciphertext encoded as Base64
    final payload = {
      'nonce': base64Encode(secretBox.nonce),
      'mac': base64Encode(secretBox.mac.bytes),
      'cipher': base64Encode(secretBox.cipherText),
    };
    return base64Encode(utf8.encode(jsonEncode(payload)));
  }

  /// Decrypts AES-GCM payload back to plaintext
  static Future<String> decrypt(String encryptedPayload, SecretKey key) async {
    try {
      final jsonStr = utf8.decode(base64Decode(encryptedPayload));
      final Map<String, dynamic> data = jsonDecode(jsonStr);

      final nonce = base64Decode(data['nonce']);
      final macBytes = base64Decode(data['mac']);
      final cipherText = base64Decode(data['cipher']);

      final secretBox = SecretBox(
        cipherText,
        nonce: nonce,
        mac: Mac(macBytes),
      );

      final clearBytes = await _algorithm.decrypt(
        secretBox,
        secretKey: key,
      );
      return utf8.decode(clearBytes);
    } catch (e) {
      return '[Decryption Failed - Invalid Key or Corrupted Message]';
    }
  }

  /// Generates a human-readable safety fingerprint
  static Future<String> getSafetyFingerprint(SecretKey key) async {
    final bytes = await key.extractBytes();
    final hash = await Sha256().hash(bytes);
    final hexStr = hash.bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
    return hexStr.substring(0, 16).toUpperCase().replaceAllMapped(
      RegExp(r'.{4}'),
      (match) => '${match.group(0)} ',
    ).trim();
  }
}
