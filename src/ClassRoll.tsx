import * as React from 'react';
import * as firebase from 'firebase';
import Store from './Store';
import { observer } from 'mobx-react';

interface ClassRollProps {
    store: Store;
}

interface ClassRollState {
    studentInitials: string;
    isRegisterHidden: boolean;
    isUpdateHidden: boolean;
    isRemoveHidden: boolean;
    tableCellsArray: JSX.Element[];
    checkedSelection: HTMLTableElement | string;
    defaultStudentInitials: string;
    registerMessage: string;
    updateMessage: string;
    checkedGroup: HTMLTableElement | string;
    isAddGroupHidden: boolean;
    isRemoveGroupHidden: boolean;
    groupName: string;
    addGroupMessage: string;
    groupCellsArray: JSX.Element[];
    isUpdateGroupHidden: boolean;
}

@observer
export default class ClassRoll extends React.Component<ClassRollProps, ClassRollState> {
    constructor() {
        super();
        this.state = {
            isRegisterHidden: true,
            isUpdateHidden: true,
            isRemoveHidden: true,
            tableCellsArray: [],
            studentInitials: '',
            defaultStudentInitials: '',
            registerMessage: 'Please enter student initials.',
            updateMessage: 'Please enter new student initials.',
            checkedGroup: '',
            isAddGroupHidden: true,
            isRemoveGroupHidden: true,
            groupName: '',
            addGroupMessage: '',
            groupCellsArray: [],
            isUpdateGroupHidden: true,
            checkedSelection: ''
        };

        this.handleBlur = this.handleBlur.bind(this);
        this.handleInput = this.handleInput.bind(this);
        this.closeWindow = this.closeWindow.bind(this);
        this.handleKeyInput = this.handleKeyInput.bind(this);
        this.removeGroup = this.removeGroup.bind(this);
        this.removeStudent = this.removeStudent.bind(this);
        this.updateStudent = this.updateStudent.bind(this);
        this.updateGroup = this.updateGroup.bind(this);
        this.activate = this.activate.bind(this);
        this.addGroup = this.addGroup.bind(this);
        this.addStudent = this.addStudent.bind(this);
        this.exportSpreadsheet = this.exportSpreadsheet.bind(this);
        this.getUserList = this.getUserList.bind(this);
    }

    /**
     * Load the students and groups from database, add event listeners
     * so the front-end is updated if changes are made to the database.
     */
    componentDidMount() {
        const self = this;

        let tempArray: JSX.Element[] = [];
        let uid = self.props.store.teacherid;

        let ref = firebase.database().ref('/users/private_students/' + uid);
        ref.once('value', function(snapshot: firebase.database.DataSnapshot) {
            snapshot.forEach(function(childSnapshot: firebase.database.DataSnapshot) {
                if (childSnapshot.key !== null && childSnapshot.key !== undefined) {
                    let student = (
                        <tr key={childSnapshot.key}>
                            <td>{childSnapshot.child('studentInitials').val()}</td>
                            <td hidden={true}>{childSnapshot.key}</td>
                        </tr>
                    );
                    tempArray.push(student);
                }
                return false;
            });
        }).then(function() {
            self.setState({tableCellsArray: tempArray});
        });

        let groupArray: JSX.Element[] = [];
        firebase.database().ref('/users/private_groups/' + self.props.store.teacherid).
        once('value', function(snapshot: firebase.database.DataSnapshot) {
            snapshot.forEach(function(childSnapshot: firebase.database.DataSnapshot) {
                let group: JSX.Element;
                if (childSnapshot.key !== null && childSnapshot.key !== undefined) {
                    group = (
                        <tr key={childSnapshot.key} className="group-table-tr">
                            <td>{childSnapshot.child('groupName').val()}</td>
                            <td hidden={true}>{childSnapshot.key}</td>
                        </tr>
                    );
                    groupArray.push(group);
                }
                return false;
            });
        }).then(function() {
            self.setState({groupCellsArray: groupArray});
        });

        // child_added listeners
        var studentsRef = firebase.database().ref('/users/private_students/' + uid);
        studentsRef.on('child_added', function (data: firebase.database.DataSnapshot) {
            if (data.key !== null && data.key !== undefined) {
                let student = (
                    <tr key={data.key}>
                        <td>{data.child('studentInitials').val()}</td>
                        <td hidden={true}>{data.key}</td>
                    </tr>
                );
                var newArr = self.state.tableCellsArray.slice();
                newArr.push(student);
                self.setState({tableCellsArray: newArr});
            }
        });

        firebase.database().ref('users/private_groups/' + uid).
        on('child_added', function(data: firebase.database.DataSnapshot) {
            if (data.key !== null && data.key !== undefined) {
                let group = (
                    <tr key={data.key} className="group-table-tr">
                        <td>{data.child('groupName').val()}</td>
                        <td hidden={true}>{data.key}</td>
                    </tr>
                );
                let newArr = self.state.groupCellsArray.slice();
                newArr.push(group);
                self.setState({groupCellsArray: newArr});
            }
        });

        // child_changed listeners
        firebase.database().ref('/users/private_students/' + uid).
        on('child_changed', function(data: firebase.database.DataSnapshot) {
            if (data.key !== null && data.key !== undefined) {
                let tempArr = self.state.tableCellsArray.slice();
                let ind: number = self.getRowIndex(data.key);
                let student = (
                    <tr key={data.key}>
                        <td>{data.child('studentInitials').val()}</td>
                        <td hidden={true}>{data.key}</td>
                    </tr>
                );
                tempArr.splice(ind, 1, student);
                self.setState({tableCellsArray: tempArr});
            }
        });

        firebase.database().ref('users/private_groups/' + uid).
        on('child_changed', function(data: firebase.database.DataSnapshot) {
            if (data.key !== null && data.key !== undefined) {
                let tempArr = self.state.groupCellsArray.slice();
                let ind: number = self.getGroupRowIndex(data.key);
                let group = (
                    <tr key={data.key} className="group-table-tr">
                        <td>{data.child('groupName').val()}</td>
                        <td hidden={true}>{data.key}</td>
                    </tr>
                );
                tempArr.splice(ind, 1, group);
                self.setState({groupCellsArray: tempArr});
            }
        });

        // child_removed listeners
        firebase.database().ref('/users/private_students/' + uid).
        on('child_removed', function(data: firebase.database.DataSnapshot) {
            if (data.key !== null && data.key !== undefined) {
                let tempArr = self.state.tableCellsArray.slice();
                let ind: number = self.getRowIndex(data.key);
                tempArr.splice(ind, 1);
                self.setState({tableCellsArray: tempArr});
            }
        });

        firebase.database().ref('users/private_groups/' + uid).
        on('child_removed', function(data: firebase.database.DataSnapshot) {
            if (data.key !== null && data.key !== undefined) {
                let tempArr = self.state.groupCellsArray.slice();
                let ind: number = self.getGroupRowIndex(data.key);
                tempArr.splice(ind, 1);
                self.setState({groupCellsArray: tempArr});
            }
        });

        // check if user has admin privileges
        firebase.database().ref('users/admin/' + this.props.store.teacherid + '/admin').
        once('value', (snapshot: firebase.database.DataSnapshot) => {
            (snapshot.val() === true) ? self.props.store.setIsAdmin(true) : self.props.store.setIsAdmin(false);
        });
    }

    /**
     * Check at which index of the table the student initials
     * are located, along with the student's key. 
     * @param { number | string } key
     */
    getRowIndex(key: number | string) {
        let ind: number = 0;
        for (let i = 0; i < this.state.tableCellsArray.length; i++) {
            if (this.state.tableCellsArray[i].key === key) {
                ind = i;
                break;
            }
        }
        return ind;
    }

    /**
     * Check at which index of the table the group 
     * is located, along with the group's key 
     * @param { number | string } 
     */
    getGroupRowIndex(key: number | string) {
        let ind: number = 0;
        for (let i = 0; i < this.state.groupCellsArray.length; i++) {
            if (this.state.groupCellsArray[i].key === key) {
                ind = i;
                break;
            }
        }
        return ind;
    }

    /**
     * Blurs the screen each time a button is clicked on 
     * the ClassRoll page. Also takes care of binding
     * the selected table row to the state variable.
     * @param { Event } e
     */
    handleBlur = (e) => {
        e.preventDefault();
        if (
            this.state.isRegisterHidden === false || 
            this.state.isUpdateHidden === false ||
            this.state.isRemoveHidden === false ||
            this.state.isAddGroupHidden === false ||
            this.state.isUpdateGroupHidden === false
        ) {
            return;
        }

        let className, childNodes, initials;
        if (
            (this.state.checkedSelection as HTMLTableElement).className !== undefined &&
            (this.state.checkedSelection as HTMLTableElement).childNodes[0] !== undefined
        ) {
                className = (this.state.checkedSelection as HTMLTableElement).className;
                childNodes = (this.state.checkedSelection as HTMLTableElement).childNodes[0];
                initials = (childNodes as HTMLTableElement).innerHTML;
        }

        if (e.target.innerHTML === 'Add Student') {
            this.setState({isRegisterHidden: !this.state.isRegisterHidden});
        } else if (e.target.innerHTML === 'Remove Student') {
            if (this.state.checkedSelection === '' || className === 'group-table-tr') {
                alert('Please select a student first.');
                return;
            }
            this.setState({
                isRemoveHidden: !this.state.isRemoveHidden,
                defaultStudentInitials: initials
            });
        } else if (e.target.innerHTML === 'Update Student') {
            if (this.state.checkedSelection === '' || className === 'group-table-tr') {
                alert('Please select a student first.');
                return;
            }
            this.setState({
                isUpdateHidden: !this.state.isUpdateHidden,
                defaultStudentInitials: initials
            });
        } else if (e.target.innerHTML === 'Activate') {
            if (this.state.checkedSelection === '') {
                alert('Please select a student or group first.');
                return;
            }
            this.activate();
        } else if (e.target.innerHTML === 'Add Group') {
            this.setState({isAddGroupHidden: !this.state.isAddGroupHidden});
        } else if (e.target.innerHTML === 'Remove Group') {
            if (this.state.checkedGroup === '') {
                alert('Please select a group first.');
                return;
            }
            this.setState({isRemoveGroupHidden: !this.state.isRemoveGroupHidden});
        } else if (e.target.innerHTML === 'Update Group') {
            if (this.state.checkedGroup === '') {
                alert('Please select a group first.');
                return;
            }
            this.setState({isUpdateGroupHidden: false});
        }
        this.props.store.blurInterface();
    }

    /**
     * Unblurs the window again, as well as changes the 
     * boolean state variables which dictate whether or 
     * not the window should be open or not. 
     */
    closeWindow() {
        if (this.state.isRegisterHidden === false) {
            this.setState({
                isRegisterHidden: !this.state.isRegisterHidden,
                studentInitials: '',
                registerMessage: 'Please enter student initials.'
            });
        } else if (this.state.isUpdateHidden === false) {
            this.setState({isUpdateHidden: !this.state.isUpdateHidden});
        } else if (this.state.isRemoveHidden === false) {
            this.setState({isRemoveHidden: !this.state.isRemoveHidden});
        } else if (this.state.isAddGroupHidden === false) {
            this.setState({isAddGroupHidden: !this.state.isAddGroupHidden});
        } else if (this.state.isRemoveGroupHidden === false) {
            this.setState({isRemoveGroupHidden: !this.state.isRemoveGroupHidden});
        } else if (this.state.isUpdateGroupHidden === false) {
            this.setState({isUpdateGroupHidden: !this.state.isUpdateGroupHidden});
        }
        this.props.store.blurInterface();
    }

    /**
     * Add student information to the Firebase database. 
     */
    addStudent() {
        const self = this;
        let uid = self.props.store.teacherid;
        var oldRef = firebase.database().ref('/users/private_students/' + uid);
        var newRef = oldRef.push();
        var errorSet = false;
        newRef.set({
            studentInitials: self.state.studentInitials.toUpperCase()
        }).catch(function(error: Error) {
            console.log(error.message);
            errorSet = true;
            self.setState({
                    registerMessage: 'Student initials must be no longer than three characters long.'
                }
            );
        }).then(function() {
            if (errorSet === false) {
                self.closeWindow();
                self.props.store.firebaseUsageEvent([{ attrName: 'number_students', attrValue: 1 }]);
            }
        });
    }

    /**
     * Remove student information from the Firebase database. 
     * @param {React.MouseEvent<HTMLButtonElement>} e
     */
    removeStudent(e: React.MouseEvent<HTMLButtonElement>) {
        const self = this;
        e.preventDefault();
        let targetHTML;
        if (e.nativeEvent.srcElement !== null) {
            targetHTML = e.nativeEvent.srcElement.innerHTML;
        }
        let key = ((this.state.checkedSelection as HTMLTableElement).childNodes[1] as HTMLTableElement).innerHTML;
        if (targetHTML === 'Yes') {
            let uid = self.props.store.teacherid;
            firebase.database().ref('/users/private_students/' + uid + '/' + key).remove().then(function() {
                self.setState({checkedSelection: ''});
                self.closeWindow();
            }).then(function() {
                self.props.store.firebaseUsageEvent([{ attrName: 'number_students', attrValue: -1 }]);
            });
        } else if (targetHTML === 'No') {
            self.closeWindow();
        }
    }

    /**
     * Updates student information from the Firebase database. 
     */
    updateStudent() {
        const self = this;
        let uid = self.props.store.teacherid;
        let key = ((this.state.checkedSelection as HTMLTableElement).childNodes[1] as HTMLTableElement).innerHTML;
        firebase.database().ref('/users/private_students/' + uid + '/' + key).update({
            studentInitials: self.state.defaultStudentInitials
        }).catch(function(error: Error) {
            console.log(error.message);
        }).then(function() {
            self.closeWindow();
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
     * Selects a student to be read with using the
     * shared reading interface and stores the id 
     * of that student in Store. 
     */
    activate() {
        let id = ((this.state.checkedSelection as HTMLTableElement).childNodes[1] as HTMLTableElement).innerHTML;
        let initials = ((this.state.checkedSelection as HTMLTableElement).childNodes[0] as HTMLTableElement).innerHTML;
        this.props.store.setmode(2);
        this.props.store.setstudentid(id);
        this.props.store.setStudentInitials(initials);
        (this.state.checkedSelection as HTMLTableElement).style.backgroundColor = 'transparent';
        this.setState({checkedSelection: ''});
        this.closeWindow();
    }

    /**
     * Binds checked selection to proper state variables. 
     */
    checkSelection = (e) => {
        e.preventDefault();
        
        if (e.target.parentElement.childNodes[0].tagName === 'TH' ||
            e.target.parentElement.tagName === 'TABLE' || e.target.parentElement.tagName === 'DIV') {
            return;
        }
        
        if (typeof this.state.checkedSelection !== 'string') {
            if (this.state.checkedSelection.style.backgroundColor === 'white') {
                if (this.state.checkedSelection === e.target.parentElement) {
                    e.target.parentElement.style.backgroundColor = 'transparent';
                    return;
                } else {
                    this.state.checkedSelection.style.backgroundColor = 'transparent';
                }
            }
        }

        if (e.target.parentElement.style.backgroundColor !== 'white') {
            if (e.target.parentElement.className === 'group-table-tr') {
                this.setState({checkedGroup: e.target.parentElement, groupName: e.target.innerHTML});
            }
            e.target.parentElement.style.backgroundColor = 'white';
            this.setState({checkedSelection: e.target.parentElement});
        } else {
            if (e.target.parentElement.className === 'group-table-tr') {
                this.setState({checkedGroup: '', groupName: ''});
            }
            e.target.parentElement.style.backgroundColor = 'transparent';
            this.setState({checkedSelection: ''});
        }
    }

    /**
     * Adds group information to Firebase database. 
     */
    addGroup() {
        const self = this;
        firebase.database().ref('users/private_groups/' + self.props.store.teacherid).push().set({
            groupName: this.state.groupName
        }).then(function() {
            self.closeWindow();
            self.props.store.firebaseUsageEvent([{ attrName: 'number_groups', attrValue: 1 }]);
        });
    }

    /**
     * Removes group information from Firebase database. 
     */
    removeGroup = (e) => {
        const self = this;
        e.preventDefault();
        if (e.target.innerHTML === 'Yes') {
            let uid = self.props.store.teacherid;
            let key = ((this.state.checkedSelection as HTMLTableElement).childNodes[1] as HTMLTableElement).innerHTML;
            firebase.database().ref('users/private_groups/' + uid + '/' + key).remove().then(function() {
                self.setState({checkedSelection: '', checkedGroup: '', groupName: ''});
                self.closeWindow();
            }).then(function() {
                self.props.store.firebaseUsageEvent([{ attrName: 'number_groups', attrValue: -1 }]);
            });
        } else if (e.target.innerHTML === 'No') {
            self.closeWindow();
        }
    }

    /**
     * Updates group informatio in Firebase database. 
     */
    updateGroup() {
        const self = this;
        let uid = self.props.store.teacherid;
        let key = ((this.state.checkedSelection as HTMLTableElement).childNodes[1] as HTMLTableElement).innerHTML;
        firebase.database().ref('/users/private_groups/' + uid + '/' + key).update({
            groupName: self.state.groupName
        }).then(function() {
            self.closeWindow();
        });
    }

    /**
     * Binds keyboard input with proper Firebase function. 
     * @param {React.KeyboardEvent<HTMLInputElement>} e 
     */
    handleKeyInput(e: React.KeyboardEvent<HTMLInputElement>) {
        let action = (e.target as HTMLInputElement).dataset.action;
        if (e.key === 'Enter') {
            if (action === 'add-student') {
                this.addStudent();
            } else if (action === 'add-group') {
                this.addGroup();
            } else if (action === 'update-student') {
                this.updateStudent();
            } else if (action === 'update-group') {
                this.updateGroup();
            }
        }
    }

    /**
     * Obtain list of all users to be exported
     */
    getUserList(): void {
        let self = this;
        let isAdmin = self.props.store.isAdmin;
        if (isAdmin === false) { 
            alert('You do not have admin privileges to access this feature.');
            return; 
        }
        let userList: Array<string> = [];
        let userKeys: Array<string> = [];
        firebase.database().ref('/users/private_usage_admin/').
        once('value', (snapshot: firebase.database.DataSnapshot) => {
            snapshot.forEach((childSnapshot) => {
                if (childSnapshot.key !== null) {
                    userKeys.push(childSnapshot.key);
                }
                userList.push(childSnapshot.child('email').val()); 
                return false;
            });
        }).then(() => {
            let userArray: Array<JSX.Element> = [];
            userList.forEach((email, index) => {
                userArray.push(
                    <div className="users" key={email}>
                        {userList[index]} 
                        <input 
                            type="checkbox" 
                            checked={false}
                            onClick={() => self.props.store.check(index)}
                        />
                    </div>
                );
            });
            self.props.store.setUserList(userArray);
            self.props.store.setUserKeys(userKeys);
            self.props.store.setIsUserListHidden(false);

            this.props.store.blurInterface();
        });
    }

    /**
     * Exports user's usage summary as well as a list of 
     * all events saved to the Firebase database. 
     */
    exportSpreadsheet = (e, exportAll: boolean) => {
        e.preventDefault();
        if (this.props.store.userList === undefined || this.props.store.userList.length === 0) { return; }
        if (this.props.store.isSignedIn === false) { return; }

        let userArray = this.props.store.userList;
        let userDetails: Array<string> = [];
        let userKeys: Array<string> = [];
        let checkCounter: number = 0;

        for  (let i = 0; i < userArray.length; i++) {
            let checked = userArray[i].props.children[1].props.checked;
            let email = userArray[i].props.children[0];
            if (checked || exportAll) {
                checkCounter++;
                userDetails.push(email);
                userKeys.push(this.props.store.userKeys[i]);
            } 
        }

        if (exportAll) {
            checkCounter = userArray.length;
        }

        if (checkCounter === 0) { 
            alert('Please select one or more users first.');
            return; 
        }

        let self = this;
        let spreadsheet: string = 'data:text/csv;charset=utf-8,';
        let rows: Array<Array<string | number>> = [];
        let usage: Array<{
            key: string | null, 
            usage: {
            email: string,
            last_active_teacher: string,
            number_books_opened: number,
            number_books_read: number,
            number_events: number,
            number_finish_reading_events: number,
            number_groups: number,
            number_page_number_events: number,
            number_pages_read: number,
            number_response_events: number,
            number_start_reading_events: number,
            number_students: number,
            number_turn_page_events: number
        }}> = [];

        rows.push(['Usage Summary'], [
            'Email', 'Last Active Teacher', 'Number Students', 'Number Groups',
            'Number Events', 'Number Books Opened', 'Number Books Read',
            'Number Pages Read', 'Number Start Reading Events',
            'Number Finish Reading Events', 'Number Response Events',
            'Number Turn Page Events', 'Number Page Number Events'
        ]);

        // Obtain usage info for all selected users from database
        firebase.database().ref('/users/private_usage_admin').
        once('value', (snapshot: firebase.database.DataSnapshot) => {
            snapshot.forEach((user) => {
                if (userDetails.indexOf(user.child('email').val()) > -1) {
                    usage.push({
                        key: user.key,
                        usage: user.val()
                    });
                }
                return false;
            });
        }).then(() => {
            // Obtain events for all selected users from database
            let events: Array<{key: string | null, events: {
                book: string,
                date: string,
                event: string,
                studentID: string,
                teacherID: string
            }}> = [];
            firebase.database().ref('/users/private_events').
            once('value', (snapshot: firebase.database.DataSnapshot) => {
                snapshot.forEach((childSnapshot) => {
                    childSnapshot.forEach((item: firebase.database.DataSnapshot) => {
                        if (userKeys.indexOf(item.val().teacherID) > - 1) {
                            events.push({
                                key: childSnapshot.key,
                                events: item.val()
                            }); 
                        }
                        return false;
                    });
                    return false;
                });
            }).then(() => {
                // Print usage information for selected users 
                usage.forEach((user) => {
                    rows.push([
                        user.usage.email,
                        user.usage.last_active_teacher,
                        user.usage.number_students,
                        user.usage.number_groups,
                        user.usage.number_events,
                        user.usage.number_books_opened,
                        user.usage.number_books_read,
                        user.usage.number_pages_read,
                        user.usage.number_start_reading_events,
                        user.usage.number_finish_reading_events,
                        user.usage.number_response_events,
                        user.usage.number_turn_page_events,
                        user.usage.number_page_number_events
                    ]);
                });
                rows.push(['\n'], ['User Activity'], ['Date', 'Student ID', 'Book', 'Event']);
                events.forEach((event, i) => {
                    rows.push([
                        event.events.date,
                        event.events.studentID,
                        event.events.book,
                        event.events.event
                    ]);
                });

                rows.forEach((child, i) => {
                    let modifier: string = '';
                    child.forEach((value, j) => {
                        if (typeof value === 'string') {
                            if (value.includes('@') === false && j === 0) {
                                modifier += value.replace(',', '') + ',';
                                return;
                            } else if (value.includes(',') && value.includes('/') && value.includes(':')) {
                                modifier += value.replace(',', '') + ',';
                                return;
                            }
                        }
                        modifier += child[j] + ',';
                    });
                    spreadsheet += (modifier + '\n');
                });

                let link = document.createElement('a');
                link.setAttribute('href', encodeURI(spreadsheet));
                link.setAttribute('download', 'activity(' + self.props.store.email + ').csv');
                link.click();
                self.props.store.setLink(link);

                self.props.store.setIsUserListHidden(true);
                this.props.store.blurInterface();
            });
        });
    }

    /**
     * Cancel export of spreadsheet  
     */

    cancelExport = (e) => {
        e.preventDefault();
        this.props.store.setIsUserListHidden(true);
        this.props.store.blurInterface();
    }

    render() {
        let user: string = 'user';
        if (this.props.store.email !== undefined && this.props.store.email !== null) {
            if (this.props.store.email !== undefined) {
                user = this.props.store.email;
            }
        }
        return (
            <div>
                <div className="dropdown-box">
                    <span className="dropdown-box-title">Account</span>
                    <div className="dropdown-contents">
                        <p> {user} </p>
                        <button
                            className="student-button"
                            type="text"
                            onClick={this.props.store.logout}
                        >
                            Logout
                        </button>
                    </div>
                </div>
                <div style={this.props.store.interfaceCSS}>
                    <table className="register-button">
                        <tbody>
                            <tr>
                                <td>
                                    <button 
                                        className="student-button add-student" 
                                        type="text" 
                                        onClick={this.handleBlur}
                                    > 
                                        Add Student
                                    </button>
                                </td>
                                <td>
                                    <button 
                                        className="student-button remove-student" 
                                        type="text" 
                                        onClick={this.handleBlur}
                                    >
                                        Remove Student
                                    </button>
                                </td>
                                <td>
                                    <button 
                                        className="student-button update-student" 
                                        type="text" 
                                        onClick={this.handleBlur}
                                    >
                                        Update Student
                                    </button>
                                </td>
                                <td>
                                    <button 
                                            className="student-button activate-student" 
                                            type="text" 
                                            onClick={this.handleBlur}
                                    >
                                        Activate
                                    </button>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <button 
                                        className="student-button add-group" 
                                        type="text"
                                        onClick={this.handleBlur}
                                    >
                                            Add Group
                                    </button>
                                </td>
                                <td>
                                    <button 
                                        className="student-button remove-group" 
                                        type="text"
                                        onClick={this.handleBlur}
                                    >
                                        Remove Group
                                    </button>
                                </td>
                                <td>
                                    <button 
                                        className="student-button update-group" 
                                        type="text"
                                        onClick={this.handleBlur}
                                    >
                                        Update Group
                                    </button>
                                </td>
                                <td>
                                    <button 
                                        className="student-button export-spreadsheet"
                                        type="text"
                                        onClick={this.getUserList}
                                    >
                                        Export Spreadsheet
                                        {() => { return this.props.store.link; }}
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <table className="student-table" onClick={this.checkSelection}>
                        <tbody>
                            <tr className="student-table-tr">
                                <th>Students</th>
                            </tr>
                            {this.state.tableCellsArray}
                            <tr className="group-table-tr">
                                <th>Groups</th>
                            </tr>
                            {this.state.groupCellsArray}
                        </tbody>
                    </table>
                </div>
                <div className="generic-register-div" hidden={this.state.isRegisterHidden} >
                    Student Initials: 
                    &nbsp;
                    <input 
                        type="text" 
                        name="studentInitials" 
                        value={this.state.studentInitials}
                        onChange={this.handleInput} 
                        placeholder="Student Initials" 
                        onKeyDown={this.handleKeyInput}
                        data-action={'add-student'}
                    />
                    <br/>
                    <span className="nested-register-span">
                        {this.state.registerMessage}
                        <br/><br/>
                        <button className="nested-register-button" type="button" onClick={this.addStudent}>
                            Add Student
                        </button>
                        &nbsp;
                        <button className="nested-register-button" type="button" onClick={this.closeWindow}>
                            Close
                        </button>
                    </span>
                </div>
                <div className="generic-register-div" hidden={this.state.isUpdateHidden}>
                    Student Initials: 
                    <input 
                        type="text" 
                        name="defaultStudentInitials" 
                        value={this.state.defaultStudentInitials} 
                        onChange={this.handleInput}
                        onKeyDown={this.handleKeyInput}
                        data-action={'update-student'}
                    />
                    <br/>
                    <span className="nested-register-span">
                        {this.state.updateMessage}
                        <br/><br/>
                        <button className="nested-register-button" type="button" onClick={this.updateStudent}>
                            Update Student
                        </button>
                        &nbsp;
                        <button className="nested-register-button" type="button" onClick={this.closeWindow}>
                            Close
                        </button>
                    </span>
                </div>
                <div className="generic-register-div" hidden={this.state.isRemoveHidden}>
                    <span className="nested-register-span">
                        {'Are you sure you would like to remove ' + 
                        this.state.defaultStudentInitials + ' from the database?'}
                        <br/><br/>
                        <button className="nested-register-button" type="button" onClick={this.removeStudent}>
                            Yes
                        </button>
                        &nbsp;
                        <button className="nested-register-button" type="button" onClick={this.removeStudent}>
                            No
                        </button>
                    </span>
                </div>
                <div className="generic-register-div" hidden={this.state.isAddGroupHidden}>
                    Group Name: 
                    &nbsp;
                    <input 
                        type="text" 
                        name="groupName" 
                        value={this.state.groupName}
                        onChange={this.handleInput} 
                        placeholder="Group Name"
                        onKeyDown={this.handleKeyInput}
                        data-action={'add-group'}
                    />
                    <br/>
                    <span className="nested-register-span">
                        {this.state.addGroupMessage}
                        <br/>
                        <button className="nested-register-button" type="button" onClick={this.addGroup}>
                            Add Group
                        </button>
                        &nbsp;
                        <button className="nested-register-button" type="button" onClick={this.closeWindow}>
                            Close
                        </button>
                    </span>
                </div>
                <div className="generic-register-div" hidden={this.state.isRemoveGroupHidden}>
                    <span className="nested-register-span">
                        {'Are you sure you would like to remove ' + this.state.groupName + ' from the database?'}
                        <br/>
                        <button 
                            className="nested-register-button remove-group-button" 
                            type="button" 
                            onClick={this.removeGroup}
                        > 
                            Yes
                        </button>

                        &nbsp;
                        <button className="nested-register-button" type="button" onClick={this.closeWindow}>No</button>
                    </span>
                </div>
                <div className="generic-register-div" hidden={this.state.isUpdateGroupHidden}>
                    Group Name: 
                    <input 
                        type="text" 
                        name="groupName" 
                        value={this.state.groupName}
                        onChange={this.handleInput}
                        onKeyDown={this.handleKeyInput}
                        data-action={'update-group'}

                    />
                    <br/>
                    <span className="nested-register-span">
                        {'Please enter new group name.'}
                        <br/><br/>
                        <button className="nested-register-button" type="button" onClick={this.updateGroup}>
                            Update Group
                        </button>
                        &nbsp;
                        <button className="nested-register-button" type="button" onClick={this.closeWindow}>
                            Close
                        </button>
                    </span>
                </div>
                <div hidden={this.props.store.isUserListHidden} className="user-list">
                    Please select users to be exported
                    <br/> <br/>
                    <form onSubmit={(e) => this.exportSpreadsheet(e, false)}>
                        {this.props.store.userList}
                        <br/>
                        <input className="user-list-submit" type="submit" value="Export"/>
                        <br/>
                    </form>
                    <button 
                        className="user-list-button user-list-button-1" 
                        onClick={this.cancelExport}
                    > 
                        Cancel 
                    </button>
                    <br/>
                    <button 
                        className="user-list-button user-list-button-2" 
                        onClick={(e) => this.exportSpreadsheet(e, true)}
                    >
                        Export All
                    </button>
                </div>
            </div>
        );
    }
}