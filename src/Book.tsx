import * as React from 'react';

interface BookProps {
    title: string;
    author: string;
    slug: string;
    url: string;
}

interface BookState {
    style: React.CSSProperties;
}

export default class Book extends React.Component<BookProps, BookState> {
    constructor () {
        super();
        this.state = {
            style: {}
        };
    }

    componentDidMount() {
        this.setState({
            style: {
                backgroundImage: 'url(https://tarheelreader.org' + '/' + `${this.props.url}`
            }
        });
    }

    render() {
        return (
            <div className="book" style={this.state.style}>
                <p className="book-title">{this.props.title}</p>
                <p className="book-author">{this.props.author}</p>
                <p className="book-slug" hidden={true}>{this.props.slug}</p>
                <p className="book-url" hidden={true}>{this.props.url}</p>
            </div>
        );
    }
}