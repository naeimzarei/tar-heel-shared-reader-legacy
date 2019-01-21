import * as React from 'react';
import { observer } from 'mobx-react';
import DevTools from 'mobx-react-devtools';
import './App.css';
import Store from './Store';
import Reader from './Reader';
import Landing from './Landing';
import * as firebase from 'firebase';

// firebase initialization
var config = {
  apiKey: 'AIzaSyCRHcXYbVB_eJn9Dd0BQ7whxyS2at6rkGc',
  authDomain: 'tarheelsharedreader-9f793.firebaseapp.com',
  databaseURL: 'https://tarheelsharedreader-9f793.firebaseio.com',
  projectId: 'tarheelsharedreader-9f793',
  storageBucket: 'tarheelsharedreader-9f793.appspot.com',
  messagingSenderId: '686575466062'
};
firebase.initializeApp(config);

@observer
class App extends React.Component<{store: Store}, {}> {
  render() {
    const {store} = this.props;
    if (store.bookid.length === 0) {
      return <Landing store={store}/>;

    } else if (store.bookP.state === 'pending') {
      return <h1>Loading</h1>;

    } else if (store.bookP.state === 'rejected') {
      console.log('store', store);
      return (
        <div>
          <ErrorMsg error={store.bookP.reason} />
          <p> /1 is the only functioning url right now</p>
        </div>
      );

    } else {
      // Set background of body to white again
      document.body.style.background = 'white';
      return (
        <div className="App">
          <Reader store={store} />
          <DevTools />
        </div>
      );
    }
  }
}

const ErrorMsg = observer((props: { error: Response|Error }) => {
  const error = props.error;
  if (error instanceof Response) {
    return <h1>{'Error: ' + error.status + '/' + error.statusText}</h1>;
  } else if (error instanceof Error) {
    return <h1>{'Error: ' + error.message}</h1>;
  } else {
    return <h1>Unknown Error</h1>;
  }
});

export default App;
