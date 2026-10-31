#!/usr/bin/env bash
# Instala as dependências deixando o Expo escolher as versões compatíveis com o SDK instalado.
# Nenhuma versão é fixada à mão de propósito: `expo install` consulta a matriz oficial do SDK.
set -euo pipefail

npm install expo react react-native
npx expo install \
  expo-status-bar expo-camera \
  expo-glass-effect expo-secure-store \
  react-native-safe-area-context react-native-screens react-native-web react-dom \
  @react-native-async-storage/async-storage firebase
npm install -D typescript @types/react

echo
echo "Confira a compatibilidade do expo-glass-effect com o SDK instalado:"
npx expo install --check || true
npm ls expo expo-glass-effect react-native || true
