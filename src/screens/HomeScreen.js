import { Text, View } from 'react-native';

import StructureStatus from '../components/StructureStatus';
import { runStructureSmokeTest } from '../utils/structureSmokeTest';

export default function HomeScreen() {
  return (
    <View>
      <Text>AHRE</Text>
      <StructureStatus ready={runStructureSmokeTest()} />
    </View>
  );
}
