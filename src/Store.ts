import { observable, computed, action } from 'mobx';
import { fromPromise, IPromiseBasedObservable } from 'mobx-utils';
import { SharedBook, fetchBook } from './SharedBook';
import * as firebase from 'firebase';

// sides of the display to include responses
type Layout = {
  left: boolean, right: boolean, top: boolean, bottom: boolean;
};

class Store {
  /**
   * Versatile function used to push events to Firebase database. 
   * @param { string } teacherID 
   * @param { string } studentInitials 
   * @param { string } book 
   * @param { string } event 
   * @param { () => void } callback 
   */
  firebaseEvent(teacherID: string, studentInitials: string, book: string, event: string, callback?: () => void): void {
    firebase.database().ref('/users/private_events/' + this.teacherid).push().set({
      teacherID: teacherID,
      studentID: studentInitials,
      date: new Date(new Date().getTime()).toLocaleString(),
      book: book,
      event: event
    }).then(() => {
      if (callback !== undefined) {
        callback();
      }
    });
  }

  /**
   * Used to push usage summary to Firebase database. 
   * @param { Array<{}> } updatedAttributes 
   * @param { () => void } callback 
   */
  firebaseUsageEvent(
    updatedAttributes: Array<{ attrName: string, attrValue: string | number }>, 
    callback?: () => void
  ) {
    if (this.isSignedIn === false) { return; }
    let newUsageSummary: {};
    firebase.database().ref('/users/private_usage/' + this.teacherid).
    once('value', (snapshot) => {
      if (snapshot.val() === null) {
        newUsageSummary = {
          email: this.email, 
          last_active_teacher: new Date(new Date().getTime()).toLocaleString(),
          number_students: 0, 
          number_books_read: 0, 
          number_pages_read: 0,
          number_events: 0, 
          number_start_reading_events: 0,
          number_finish_reading_events: 0, 
          number_response_events: 0,
          number_page_number_events: 0, 
          number_turn_page_events: 0,
          number_groups: 0,
          number_books_opened: 0
        };
      } else {
        newUsageSummary = {
          email: snapshot.child('email').val(),
          last_active_teacher: new Date(new Date().getTime()).toLocaleString(),
          number_students: snapshot.child('number_students').val(),
          number_books_read: snapshot.child('number_books_read').val(),
          number_pages_read: snapshot.child('number_pages_read').val(),
          number_events: snapshot.child('number_events').val(),
          number_start_reading_events: snapshot.child('number_start_reading_events').val(),
          number_finish_reading_events: snapshot.child('number_finish_reading_events').val(),
          number_response_events: snapshot.child('number_response_events').val(),
          number_page_number_events: snapshot.child('number_page_number_events').val(),
          number_turn_page_events: snapshot.child('number_turn_page_events').val(),
          number_groups: snapshot.child('number_groups').val(),
          number_books_opened: snapshot.child('number_books_opened').val()
        };

        if (updatedAttributes.length <= 0) { return; }
        let numberEvents: number = 0;
        for (let i = 0; i < updatedAttributes.length; i++) {
          if (updatedAttributes[i].attrName !== 'number_students' && 
              updatedAttributes[i].attrName !== 'number_groups') {
            numberEvents++;
          }
        }
        updatedAttributes.push({ attrName: 'number_events', attrValue: numberEvents });
        
        for (let i = 0; i < updatedAttributes.length; i++) {
          if (updatedAttributes[i].attrName in newUsageSummary) {
            if (typeof updatedAttributes[i].attrValue === 'number') {
              newUsageSummary[updatedAttributes[i].attrName] = 
              updatedAttributes[i].attrValue + newUsageSummary[updatedAttributes[i].attrName];
            } else {
              newUsageSummary[updatedAttributes[i].attrName] = updatedAttributes[i].attrValue;
            }
          }
        }
      }
    }).then(() => {
      firebase.database().ref('/users/private_usage/' + this.teacherid).set(newUsageSummary).then(() => {
        if (callback !== undefined) {
          callback();
        }
      });
      firebase.database().ref('/users/private_usage_admin/' + this.teacherid).set(newUsageSummary).then(() => {
        if (callback !== undefined) {
          callback();
        }
      });
    });
  }

  /**
   * Logs the user out of the Firebase interface 
   */
  @action.bound logout(): void {
    const self = this;
    firebase.auth().signOut().then(function () {
      self.setmode(0);
      self.setIsSignedIn(false);
    }).catch(function (err: Error) {
      console.log(err.message);
    });
  }

  /**
   * Blurs or unblurs the main interface 
   */
  @action.bound blurInterface(): void {
    this.interfaceCSS = {
      position: 'absolute',
      width: '750px',
      height: '600px',
      background: 'linear-gradient(white, #8e8e8e)',
      display: 'inline-flex',
      left: '50%',
      top: '50%',
      marginLeft: '-375px',
      marginTop: '-300px',
      borderRadius: '25px',
      userSelect: 'none',
      filter: (this.interfaceCSS.filter === 'blur(10px)') ? 'blur(0px)' : 'blur(10px)',
      overflowY: 'auto',
      overflowX: 'hidden'
    };
  }

  // the interface CSS 
  @observable interfaceCSS: React.CSSProperties = {
    position: 'absolute',
    width: '750px',
    height: '600px',
    background: 'linear-gradient(white, #8e8e8e)',
    display: 'inline-flex',
    left: '50%',
    top: '50%',
    marginLeft: '-375px',
    marginTop: '-300px',
    borderRadius: '25px',
    userSelect: 'none',
    filter: 'blur(0px)',
    overflowY: 'auto',
    overflowX: 'hidden'
  };
  // the selected student's initials
  @observable studentInitials: string = '';
  // set the selected student's initials 
  @action.bound setStudentInitials(studentInitials: string) {
    this.studentInitials = studentInitials;
  }
  // is the user list hidden or not
  @observable isUserListHidden: boolean = true;
  // set if user list is hidden or not
  @action.bound setIsUserListHidden(isUserListHidden: boolean) {
    this.isUserListHidden = isUserListHidden;
  }
  // does user have admin privileges 
  @observable isAdmin: boolean = false;
  // set user admin privileges
  @action.bound setIsAdmin(isAdmin: boolean) {
    this.isAdmin = isAdmin;
  }
  // either checks or unchecks a checkbox
  @action.bound check(index: number) {
    this.userList[index].props.children[1].props.checked = 
    !this.userList[index].props.children[1].props.checked;
  }
  // list of user keys 
  @observable userKeys: Array<string>;
  // set list of user keys 
  @action.bound setUserKeys(userKeys: Array<string>) {
    this.userKeys = userKeys;
  }
  // list of user emails
  @observable userList: JSX.Element[];
  // set list of user emails 
  @action.bound setUserList(userList: JSX.Element[]) {
    this.userList = userList;
  }
  // uri for spreadsheet export 
  @observable link: HTMLAnchorElement;
  // set uri for spreadsheet export 
  @action.bound setLink(link: HTMLAnchorElement): void {
    this.link = link;
  }
  // initial Accordion component (recent books)
  @observable initialAccordion: JSX.Element | string = '';
  // set initial Accordion component
  @action.bound setInitialAccordion(initialAccordion: string | JSX.Element) {
    this.initialAccordion = initialAccordion;
  }
  // main Accordion component (all other books)
  @observable accordion: JSX.Element | string = '';
  // set main Accordion component
  @action.bound setAccordion(accordion: string | JSX.Element) {
    this.accordion = accordion;
  }
  // login message 
  @observable message: string = 'Please sign in to Google to continue';
  // change login message 
  @action.bound setMessage(message: string): void {
    this.message = message;
  }
  // is the user signing in to firebase
  @observable isSigningIn: boolean = false;
  // change status of logging
  @action.bound setIsSigningIn(isSigningIn: boolean) {
    this.isSigningIn = isSigningIn;
  }
  // is the user signed in to firebase
  @observable isSignedIn: boolean = false;
  // change status of login
  @action.bound setIsSignedIn(isSignedIn: boolean) {
    this.isSignedIn = isSignedIn;
  }
  // the Landing page number
  @observable mode: number = 0;
  // set Landing page number
  @action.bound setmode(mode: number) {
    this.mode = mode;
  }
  // the firebase id (teacherID)
  @observable teacherid: string = '';
  // set the firebase id (teacherID)
  @action.bound setteacherid(id: string) {
    this.teacherid = id;
  }
  // the firebase email
  @observable email: string = '';
  // set the firebase email 
  @action.bound setemail(email: string) {
    this.email = email;
  }
  // the student's id
  @observable studentid: string = '';
  // set student's id
  @action.bound setstudentid(id: string) {
    this.studentid = id;
  }
  // the id of the book to read or '' for the landing page
  @observable bookid: string = '';
  // an observable promise for the book associated with bookid
  @computed get bookP() {
    return fromPromise(fetchBook(`/api/sharedbooks/${this.bookid}.json`)) as
        IPromiseBasedObservable<SharedBook>; }
  // get the book without having to say bookP.value all the time
  // these computed are cached so this function only runs once after a change
  @computed get book() { return this.bookP.value; }
  // the page number we're reading
  @observable pageno: number = 1;
  // number of pages in the book
  @computed get npages() { return this.book.pages.length; }
  // update the state typically from a URL
  @action.bound setIdPage(id: string, page: number) {
    this.bookid = id;
    this.pageno = page;
  }
  // map the state to a url
  @computed get currentPath() {
    return `/${this.bookid}` + (this.pageno > 1 ? `/${this.pageno}` : '');
  }
  // step to the next page
  // turnPage event
  @action.bound nextPage() {
    if (this.pageno <= this.npages) {
      this.pageno += 1;
      this.firebaseEvent(
        this.teacherid, 
        this.studentInitials, 
        this.book.title, 
        'PAGE NUMBER ' + this.pageno,
        () => {
          this.firebaseEvent(
            this.teacherid,
            this.studentInitials,
            this.book.title,
            'TURN PAGE'
          );
        }
      );
      this.firebaseUsageEvent([
        { attrName: 'number_page_number_events', attrValue: 1 },
        { attrName: 'number_turn_page_events', attrValue: 1 },
        { attrName: 'number_pages_read', attrValue: 1 }
      ]);
    }
    console.log('nextPage', this.pageno);
  }
  // step back to previous page
  // turnPage event
  @action.bound backPage() {
    let doesPageNumberEventExist: boolean = false;
    let updatedAttributes: Array<{attrName: string, attrValue: string | number }> = [];

    if (this.pageno > 1) {
      this.pageno -= 1;
      doesPageNumberEventExist = true;
    } else {
      this.pageno = this.npages + 1;
      return;
    }

    if (doesPageNumberEventExist) {
      this.firebaseEvent(
        this.teacherid,
        this.studentInitials,
        this.book.title,
        'PAGE NUMBER ' + this.pageno,
        () => {
          this.firebaseEvent(
            this.teacherid,
            this.studentInitials,
            this.book.title,
            'TURN PAGE'
          );
        }
      );
      updatedAttributes.push(
        { attrName: 'number_page_number_events', attrValue: 1 }, 
        { attrName: 'number_turn_page_events', attrValue: 1 },
        { attrName: 'number_pages_read', attrValue: 1 }
      );
    } else {
      this.firebaseEvent(
        this.teacherid,
        this.studentInitials,
        this.book.title,
        'TURN PAGE'
      );
      updatedAttributes.push(
        { attrName: 'number_turn_page_events', attrValue: 1 },
        { attrName: 'number_pages_read', attrValue: 1 } 
      );
    }
    this.firebaseUsageEvent(updatedAttributes);
    console.log('backPage', this.pageno);
  }
  // set the page number
  @action.bound setPage(i: number) {
    this.pageno = i;
    this.firebaseEvent(
      this.teacherid,
      this.studentInitials,
      this.book.title,
      'PAGE NUMBER ' + this.pageno
    );
    this.firebaseUsageEvent([
      { attrName: 'number_page_number_events', attrValue: 1}
    ]);
  }
  // index to the readings array
  @observable reading: number = 0;
  @action.bound setReading(n: number) {
    this.reading = n;
    this.responseIndex = 0;
  }
  @computed get nreadings() { return this.book.readings.length; }
  // get comment for page and reading
  @computed get comment() {
    if (this.pageno <= this.npages) {
      return this.book.readings[this.reading].comments[this.pageno - 1];
    } else {
      return '';
    }
  }
  // get responses for this reading
  @computed get responses() { return this.book.readings[this.reading].responses; }

  // placement of the response symbols
  @observable layout: Layout = {
    left: true, right: true, top: false, bottom: false };
  @action.bound setLayout(side: string, value: boolean) {
    this.layout[side] = value;
  }

  // size of the response symbols
  @observable responseSize: number = 30;
  @action.bound setResponseSize(i: number) {
    this.responseSize = i;
  }

  // currently selected response symbol
  @observable responseIndex: number = 0;
  @computed get nresponses() { return this.book.readings[this.reading].responses.length; }
  @action.bound nextResponseIndex() {
    this.responseIndex = (this.responseIndex + 1) % this.nresponses;
  }
  @action.bound setResponseIndex(i: number) {
    this.responseIndex = i;
  }
  // current response
  @computed get word() { return this.responses[this.responseIndex]; }

  // visibility of the controls modal
  @observable controlsVisible: boolean = false;
  @action.bound toggleControlsVisible() {
    this.controlsVisible = !this.controlsVisible;
  }
  // visibility of page turn buttons on book page
  @observable pageTurnVisible: boolean = true;
  @action.bound togglePageTurnVisible() {
    this.pageTurnVisible = !this.pageTurnVisible;
  }
  // screen dimensions updated on resize
  @observable screen = {
    width: window.innerWidth,
    height: window.innerHeight
  };
  @action.bound resize() {
    this.screen.width = window.innerWidth;
    this.screen.height = window.innerHeight;
  }
  // json string to persist the state
  @computed get persist(): string {
    return JSON.stringify({
      layout: this.layout,
      responseSize: this.responseSize,
      pageTurnVisible: this.pageTurnVisible
    });
  }
  // restore the state from json
  @action.bound setPersist(js: string) {
    var v = JSON.parse(js);
    this.layout = v.layout;
    this.responseSize = v.responseSize;
    this.pageTurnVisible = v.pageTurnVisible;
  }
}

export default Store;
