import { Text } from 'react-native';

export default function StructureStatus({ ready }) {
  return <Text>{ready ? 'Estructura base lista.' : 'Revisar estructura base.'}</Text>;
}
