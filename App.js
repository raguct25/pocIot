import React, { Component } from "react";
import {
  StyleSheet,
  Text,
  View,
  NativeModules,
  Button,
  NativeEventEmitter,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator
} from "react-native";

import BleManager from "react-native-ble-manager";
import { stringToBytes, bytesToString } from "convert-string";
import bytesCounter from "bytes-counter";

import { Buffer as bf } from "buffer";

const Buffer = {
  decode: inputData => bf.from(inputData).toString()
};

type Props = {};

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);
// const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });

const bletiming = {
  timeOutValue: 7000,
  scanTiming: 2
};

class App extends Component<Props> {
  constructor() {
    super();
    this.state = {
      scannedDevices: new Map(),
      connectedPeripheralId: null,
      isScanning: false,
      isRefresh: false
    };
  }

  componentDidMount() {
    // BleManager.start();
    BleManager.start({ showAlert: false }).then(() => {
      console.log("Module initialized...");
    });
    this.startScan();
    this.handlerDiscover = bleManagerEmitter.addListener(
      "BleManagerDiscoverPeripheral",
      this.handleDiscoverPeripheral
    );

    this.handlerStop = bleManagerEmitter.addListener(
      "BleManagerStopScan",
      this.handleStopScan
    );
  }

  componentWillUnmount() {
    this.handlerDiscover.remove();
    this.handlerStop.remove();
  }

  startScan = () => {
    console.log("scan called");
    if (!this.state.isScanning) {
      console.log("scannedDevices", this.state.scannedDevices);
      this.setState({ scannedDevices: new Map() });
      BleManager.scan([], bletiming.scanTiming, true).then(() => {
        this.setState({ isScanning: true });
      });
    }
  };

  handleDiscoverPeripheral = devices => {
    let scannedDevices = this.state.scannedDevices;
    if (!scannedDevices.has(devices.id)) {
      scannedDevices.set(devices.id, devices);
      this.setState({ scannedDevices });
    }
  };

  handleStopScan = () => {
    this.setState({
      isScanning: false,
      isRefresh: true
    });
  };

  scanningRefresh = () => {
    this.setState({ isRefresh: false, isScanning: false }, () => {
      this.startScan();
    });
  };

  connectDevice = () => {
    const id = "54:4A:16:7B:79:25";
    BleManager.connect(id)
      .then(() => {
        console.log("Connected");
      })
      .catch(error => {
        console.log("error", error);
      });
    BleManager.retrieveServices(id).then(peripheralInfo => {
      console.log("peripheralInfo data", peripheralInfo);
    });
  };

  fetchRfid = () => {
    const id = "54:4A:16:7B:79:25";
    const serviceId = "FFE0";
    const characterID = "FFE1";
    // const cmdCommand = "$SYC7866#";
    const cmdCommand = "SYC";
    const data = stringToBytes(cmdCommand);
    console.log("data", data);

    BleManager.write(id, serviceId, characterID, data)
      .then(() => {
        const result = bytesToString(data);
        console.log("Write: " + result);
        BleManager.read(id, serviceId, characterID)
          .then(readData => {
            const result = bytesToString(readData);
            console.log("Read: " + readData);
          })
          .catch(error => {
            console.log(error);
          });
      })
      .catch(error => {
        console.log(error);
      });
  };

  disconnectRfid = () => {
    const id = "54:4A:16:7B:79:25";
    BleManager.disconnect(id)
      .then(() => {
        console.log("Disconnected");
      })
      .catch(error => {
        console.log(error);
      });
  };

  render() {
    const listPeripherals = Array.from(this.state.scannedDevices.values());
    // const dataSource = ds.cloneWithRows(listPeripherals);
    console.log("listPeripherals", listPeripherals);
    // console.log("dataSource", dataSource);
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>Welcome to React Native!</Text>
        <Button
          onPress={this.scanningRefresh}
          title="Refresh"
          color="#841584"
          accessibilityLabel="Learn more about this purple button"
        />
        <Button
          onPress={this.connectDevice}
          title="connect"
          color="#841584"
          accessibilityLabel="Learn more about this purple button"
        />
        <Button
          onPress={this.fetchRfid}
          title="Fetch"
          color="#841584"
          accessibilityLabel="Learn more about this purple button"
        />
        <Button
          onPress={this.disconnectRfid}
          title="Disconnect"
          color="#841584"
          accessibilityLabel="Learn more about this purple button"
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF"
  },
  welcome: {
    fontSize: 20,
    textAlign: "center",
    margin: 10
  },
  instructions: {
    textAlign: "center",
    color: "#333333",
    marginBottom: 5
  }
});

export default App;
