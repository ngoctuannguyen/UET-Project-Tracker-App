import { AntDesign } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import PhotoPreviewSection from '@/components/PhotoPreviewSection';

export default function Camera() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<any>(null);
  const cameraRef = useRef<CameraView | null>(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const handleTakePhoto = async () => {
    if (cameraRef.current) {
      const options = {
        quality: 1,
        base64: true,
        exif: false,
      };
      const takenPhoto = await cameraRef.current.takePictureAsync(options);
      setPhoto(takenPhoto);
    }
  };

  const handleRetakePhoto = () => setPhoto(null);

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        {/* Camera view */}
        <View style={styles.cameraContainer}>
          {/* <Text style={styles.cameraTitle}>Camera</Text> */}
        </View>
      </CameraView>

      {/* Chụp ảnh và ảnh đã chụp */}
      {photo ? (
        <PhotoPreviewSection photo={photo} handleRetakePhoto={handleRetakePhoto} />
      ) : (
        <>
          <View style={styles.previewContainer}>
            <Text>Ảnh đã chụp</Text>
            <View style={styles.photoPreviewBox}></View>
          </View>

          <View style={styles.resultContainer}>
            <Text>Kết quả tìm kiếm</Text>
            <View style={styles.resultBox}></View>
          </View>
        </>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleTakePhoto}>
          <AntDesign name="camera" size={44} color="white" />
          <Text>Chụp ảnh</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => alert('Xác nhận')}>
          <Text style={styles.confirmText}>Xác nhận</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DEF4D7',
    justifyContent: 'space-between',
    padding: 20,
  },
  camera: { // Thêm dòng này
    height: '25%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: 15,
    marginBottom: 20,
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: 15,
    marginBottom: 20,
  },
  cameraTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  previewContainer: {
    marginBottom: 20,
    backgroundColor: '#F0F0F0',
    padding: 20,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPreviewBox: {
    width: '100%',
    height: 150,
    backgroundColor: '#ddd',
    borderRadius: 10,
  },
  resultContainer: {
    marginBottom: 20,
    backgroundColor: '#F0F0F0',
    padding: 20,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center', 
  },
  resultBox: {
    width: '100%',
    height: 100,
    backgroundColor: '#ccc',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center', 
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '45%',
  },
  confirmText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
