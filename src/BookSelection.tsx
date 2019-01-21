import * as React from 'react';
import Store from './Store';
import Accordion from 'react-responsive-accordion';
import Book from './Book';
import * as firebase from 'firebase';
import { observer } from 'mobx-react';

interface BookSelectionProps {
    store: Store;
}

interface BookSelectionState {
    outerDivStyle: Object;
    bookArray: JSX.Element[];
    checkedSelection: string | HTMLDivElement;
}

@observer 
export default class BookSelection extends React.Component<BookSelectionProps, BookSelectionState> {
    constructor() {
        super();

        this.state = {
            outerDivStyle: {
                fontFamily: 'Didot',
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
                overflowY: 'auto',
                overflowX: 'hidden',
                filter: 'blur(0px)'
            },
            bookArray: [],
            checkedSelection: ''
        };

        this.chooseBook = this.chooseBook.bind(this);
    }

    /**
     * Renders the most recent books in the Firebase database for
     * that particular user. Add event listeners to update the 
     * recent books if the user selects a new book. 
     */
    componentDidMount() {
        const self = this;

        let url = window.location.protocol + '//' + window.location.host + '/api/sharedbooks/';
        let currentBook = 'index.json';
        let fullURL = url + currentBook;

        let bookArray: JSX.Element[] = [];
        let arr: JSX.Element[] = [];

        // child_changed listener
        firebase.database().ref('/users/private_variables/' + self.props.store.teacherid).
        on('child_changed', function(data: firebase.database.DataSnapshot) {
            renderRecentBooks();
        });

        firebase.database().ref('/users/private_variables/' + self.props.store.teacherid).
        on('child_added', function (data: firebase.database.DataSnapshot) {
            renderRecentBooks();
        });

        function renderRecentBooks() {
            let bar: JSX.Element[] = [];

            function pushBook(b: {titles: string[], authors: string[], slugs: string[]}, index: number) {
                let foo: JSX.Element[] = [];
                let ref = '';
                fetch(fullURL).then(function(response: Response) {
                    response.json().then(function(result: JSON) {
                        for (let i = 0; i < Object.keys(result).length; i++) {
                            if (result[i].slug === b.slugs[index]) {
                                ref = result[i].cover.url;
                                break;
                            }
                        }
                    }).then(function() {
                        bar.push(
                            (
                                <Book 
                                    key={index} 
                                    title={b.titles[index]}
                                    author={b.authors[index]}
                                    slug={b.slugs[index]}
                                    url={ref}
                                />
                            )
                        );
    
                        let initialDiv =
                        (
                            <div data-trigger={'Recent Books'} className="book-table">
                                {bar}
                            </div>
                        );
                        foo.push(initialDiv);
                        self.props.store.setInitialAccordion(
                            <Accordion startPosition={0} transitionTime={200}>
                                {foo}
                            </Accordion>
                        );
                    });
                });
            }

            firebase.database().ref('/users/private_variables/' + self.props.store.teacherid).
            once('value', function (snapshot: firebase.database.DataSnapshot) {
                if (snapshot.child('titles').val() !== null) {
                    let books = {
                        titles: snapshot.child('titles').val().split('#$#'),
                        authors: snapshot.child('authors').val().split('#$#'),
                        slugs: snapshot.child('slugs').val().split('#$#')
                    };
                    let length = books.titles.length;

                    if (length >= 1) {
                        pushBook(books, 0);
                        if (length >= 2) {
                            pushBook(books, 1);
                            if (length === 3) {
                                pushBook(books, 2);
                            }
                        }
                    } 
                }
            });
        }

        fetch(fullURL).then(function(response: Response) {
            response.json().then(function(result: JSON) {
                let currentCategory = result[0].sheet;
                for (let i = 0; i < Object.keys(result).length; i++) {
                    let newCategory = result[i].sheet;
                    if (i === Object.keys(result).length - 1) {
                        bookArray.push(
                            <Book 
                                  key={i} 
                                  title={result[i].title} 
                                  author={result[i].author} 
                                  slug={result[i].slug}
                                  url={result[i].cover.url}
                            />
                        );
                        let div =
                            (
                                <div data-trigger={currentCategory} className="book-table">
                                    {bookArray}
                                </div>
                            );
                        arr.push(div);
                        currentCategory = newCategory;
                        bookArray = [];
                        break;
                    }
    
                    if (currentCategory === newCategory) {
                        bookArray.push(
                            <Book 
                                key={i} 
                                title={result[i].title} 
                                author={result[i].author} 
                                slug={result[i].slug}
                                url={result[i].cover.url}
                            />
                        );
                    } else if (currentCategory !== newCategory) {
                        let div = (
                            <div data-trigger={currentCategory} className="book-table">
                                {bookArray}
                            </div>
                        );
                        arr.push(div);
                        currentCategory = newCategory;
                        bookArray = [];
                        bookArray.push(
                            <Book 
                                key={i} 
                                title={result[i].title} 
                                author={result[i].author} 
                                slug={result[i].slug}
                                url={result[i].cover.url}
                            />
                        );
                    }
                }
            }).then(function() {
                self.props.store.setAccordion(
                    <Accordion startPosition={-1} transitionTime={200}>
                        {arr}
                    </Accordion>
                );
            });
        }).catch(function(err: Error) {
            console.log(err);
        });
    }

    /**
     * Select a particular book and update the Firebase database
     * with new recent books. 
     */
    chooseBook = (e) => {
        e.preventDefault();
        const self = this;
        let className = e.target.className;
        let selection: string | HTMLDivElement = '';

        if (className === 'book' || className === 'book-title' || className === 'book-author') {
            if (className === 'book') {
                selection = e.target;
            } else if (className === 'book-title') {
                selection = e.target.parentNode;
            } else if (className === 'book-author') {
                selection = e.target.parentNode;
            }
        } else {
            return;
        }

        function getNodeText(ind: number): string {
            let nodes = (self.state.checkedSelection as HTMLDivElement).childNodes;
            return (nodes[ind] as HTMLDivElement).innerHTML;
        }

        this.setState({checkedSelection: selection}, confirmBook);
        function confirmBook() {
            let title = getNodeText(0);
            let author = getNodeText(1);
            let slug = getNodeText(2);

            // pageNumber, startReading events
            self.props.store.firebaseEvent(
                self.props.store.teacherid,
                self.props.store.studentInitials,
                title,
                'PAGE NUMBER 1',
                () => {
                    self.props.store.firebaseEvent(
                        self.props.store.teacherid, 
                        self.props.store.studentInitials, 
                        title, 
                        'START READING'
                    );
                }
            );

            self.props.store.firebaseUsageEvent([
                { attrName: 'number_page_number_events', attrValue: 1 },
                { attrName: 'number_start_reading_events', attrValue: 1 },
                { attrName: 'number_books_opened', attrValue: 1 } 
            ]);

            firebase.database().ref('users/private_variables/' + self.props.store.teacherid).
            once('value', function(snapshot: firebase.database.DataSnapshot) {
                // Updates recent books in the database given 
                // the titles, slugs, and authors of all 
                // three books 
                function updateDatabase(book: {titles: string, authors: string, slugs: string}) {
                    firebase.database().ref('users/private_variables/' + self.props.store.teacherid).set({
                        titles: book.titles,
                        authors: book.authors,
                        slugs: book.slugs
                    });
                }
                // There are books in the database
                let books;
                if (snapshot.child('titles').val() !== null) {
                    books = {
                        titles: snapshot.child('titles').val().split('#$#'),
                        authors: snapshot.child('authors').val().split('#$#'),
                        slugs: snapshot.child('slugs').val().split('#$#')
                    };
                    let length = books.titles.length;

                    // Check for duplicate books
                    if (snapshot.child('titles').val().includes(title)) {
                        return;
                    }

                    // One book in the database
                    if (length === 1) {
                        // Shift over book 1 -> book 2, store new book 1
                        updateDatabase({
                                titles: title + '#$#' + books.titles[0], 
                                authors: author + '#$#' + books.authors[0], 
                                slugs: slug + '#$#' + books.slugs[0]
                        });
                    // Two books in the database 
                    } else if (length === 2) {
                        // Shift book 2 -> book 3, book 1 -> book 2
                        updateDatabase({
                            titles: title + '#$#' + books.titles[0] + '#$#' + books.titles[1],
                            authors: author + '#$#' + books.authors[0] + '#$#' + books.authors[1],
                            slugs: slug + '#$#' + books.slugs[0] + '#$#' + books.slugs[1]
                        });
                    // Three books in the database 
                    } else if (length === 3) {
                        // Move book 1 -> book 2, book 2 -> book 3
                        updateDatabase({
                            titles: title + '#$#' + books.titles[0] + '#$#' + books.titles[1],
                            authors: author + '#$#' + books.authors[0] + '#$#' + books.authors[1],
                            slugs: slug + '#$#' + books.slugs[0] + '#$#' + books.slugs[1]
                        });
                    }
                } else {
                    // No books in the database
                    updateDatabase({titles: title, authors: author, slugs: slug});
                }
            }).catch(function(err: Error) {
                console.log(err);
            }).then(function() {
                // open THR with selected book
                self.props.store.setIdPage(slug, 1);
                self.props.store.firebaseUsageEvent([{ attrName: 'number_books_opened', attrValue: 1}]);
            });
        }
    }

    render () {
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
                <div style={this.state.outerDivStyle}>
                    <div className="book-table" onClick={this.chooseBook}>
                        {this.props.store.initialAccordion}
                        {this.props.store.accordion}
                    </div>
                </div>
            </div>
        );
    }
}