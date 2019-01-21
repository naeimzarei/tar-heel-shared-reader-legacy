import * as React from 'react';
import * as firebase from 'firebase';
import Store from './Store';
import BookSelection from './BookSelection';
import ClassRoll from './ClassRoll';
import { observer } from 'mobx-react';
import './Landing.css';

interface LandingProps {
    store: Store;
}

interface LandingState {}

@observer
export default class Landing extends React.Component <LandingProps, LandingState> {
    constructor () {
        super();

        this.handleInput = this.handleInput.bind(this);
        this.validate = this.validate.bind(this);
    }

    /**
     * Take user to proper login page, if the user is logged in 
     * to Firebase and is an active member. 
     */
    componentDidMount() {
        const self = this;

        firebase.auth().onAuthStateChanged(function(user: firebase.User) {
            if (user) {
                if (self.props.store.mode !== 2) {
                    // Set the firebase teacherid in store
                    self.props.store.setteacherid(user.uid);
                    // set the firebase email in store 
                    if (user.email !== null) {
                        self.props.store.setemail(user.email);
                    }
                    // If the user is already logged on, 
                    // then go straight to ClassRoll
                    firebase.database().ref('users/admin/' + user.uid + '/active').
                    once('value', function (snapshot: firebase.database.DataSnapshot) {
                        let active = snapshot.val();
                        if (active) {
                            self.props.store.setIsSignedIn(true);
                            self.props.store.setmode(1);
                        }
                    }).catch(function(error: Error) {
                        console.log(error);
                    });
                }
            }
        });
    }

    /**
     * Each time a value is inputted by the user, 
     * the state variables are updated to reflect
     * the changes. 
     */
    handleInput = (e) => {
        e.preventDefault();
        let name = e.target.name;
        this.setState({[name]: e.target.value});
    }

    /**
     * Logs the user in Firebase authentication system. 
     * Checks if user is authenticated and is an active
     * member. If user is not currently active, make 
     * request to check if user should be activated.
     * If user is indeed active, grant access. Otherwise,
     * reject access to shared reading interface. 
     * @param { React.MouseEvent<HTMLButtonElement> } e
     */
    validate(e: React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault();
        const self = this;

        // If user is already signed in or is in process of
        // doing so, don't redirect 
        if (this.props.store.isSignedIn || this.props.store.isSigningIn) {
            return;
        }

        // The user is in the process of signing in 
        self.props.store.setIsSigningIn(true);

        // Sign in to Google
        var provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider).then((result: firebase.auth.UserCredential) => {
            // Make sure Firebase is not null during log in process 
            if (result !== null) {
                if (result.user !== null && result.user) {
                    if (result.user.uid !== null && result.user.email !== null) {
                        // set the teacherID in store
                        self.props.store.setteacherid(result.user.uid);
                        // set the user's email in store
                        self.props.store.setemail(result.user.email);
                    }
                }
            }

            // Check if user has active flag, grant access 
            let active: boolean = false;
            firebase.database().ref('users/admin/' + self.props.store.teacherid + '/active').
            once('value', function(snapshot: firebase.database.DataSnapshot) {
                active = snapshot.val();
            }).then(function() {
                // The user is active. Grant access. 
                if (active) {
                    self.props.store.setmode(1);
                    self.props.store.setIsSignedIn(true);
                    self.props.store.firebaseUsageEvent([]);
                } else {
                    // Run activation script
                    fetch('http://localhost:8080/activate', {
                        method: 'POST',
                        headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            teacherID: self.props.store.teacherid,
                            email: self.props.store.email
                        })
                    }).then((response) => response.json()).then((responseJson) => {
                        // The user is now registered. Grant access.
                        if (responseJson.active) {
                            self.props.store.setmode(1);
                            self.props.store.setIsSignedIn(true);
                            self.props.store.firebaseUsageEvent([]);
                        // The user is not registered. Do not grant access. 
                        } else {
                            self.props.store.
                            setMessage('Email is not verified. Please contact Dr. Erickson for assistance.');
                        }
                        console.log(responseJson);
                    }).catch((error: Error) => {
                        if (error.message === 'Failed to fetch') {
                            self.props.store.
                            setMessage('Activation script is currently offline. Please try again later.');
                        }
                    });
                }
            });
        }).catch((error) => {
            // Check for common errors and report to user 
            let code = error['code'];
            if (code === 'auth/web-storage-unsupported') {
                self.props.store.setMessage('Please make sure JavaScript and 3rd party cookies are enabled.');
            } else if (code === 'auth/invalid-user-token') {
                self.props.store.setMessage('Sessions ended. Please refresh the page and login again.');
            } else if (code === 'auth/network-request-failed') {
                self.props.store.setMessage('Please make sure you are connected to the Internet.');
            } else if (code === 'auth/too-many-requests') {
                self.props.store.setMessage('Too many requests. Please wait a couple minutes and then try agian.');
            } else if (code === 'auth/user-disabled') {
                self.props.store.setMessage('The user has been disabled. Please contact an administrator.');
            } else if (code === 'auth/web-storage-unsupported') {
                self.props.store.setMessage('Please enable web storage first.');
            } else if (code === 'auth/popup-closed-by-user') {
                self.props.store.setMessage('The popup was closed by the user. Please try logging in again.');
            }

            console.log('code', code);
            console.log(error.message);
        }).then(() => {
            // The user is no longer signing in
            self.props.store.setIsSigningIn(false);
        });
    }

    render () {
        // Sign in page
        if (this.props.store.mode === 0) {
            return (
                <div className="landing-outer-div">
                <div className="landing-inner-div">
                    <h1 style={{color: '#a35167', fontSize: '30px'}}>Tar Heel Shared Reader</h1>
                    <div className="landing-innermost-div">
                        {this.props.store.message}
                    </div>
                    <br/>
                    &nbsp;
                    <button className="nested-register-button" type="button" onClick={this.validate}>Login
                    </button>
                </div>
            </div>
            );
        // Class page 
        } else if (this.props.store.mode === 1) {
            return <ClassRoll store={this.props.store} />;
        // Books page
        } else  {
            return <BookSelection store={this.props.store}/>;
        }
    }
}
