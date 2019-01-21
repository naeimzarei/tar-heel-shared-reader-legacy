import * as React from 'react';
import { observer } from 'mobx-react';
import KeyHandler from 'react-key-handler';
import Modal = require('react-modal');
const NextArrow = require('./NextArrow.png');
const BackArrow = require('./BackArrow.png');
import Store from './Store';
import SharedBook from './SharedBook';
import './Reader.css';

const Reader = observer(function Reader(props: {store: Store}) {
  const { store } = props;
  const book = store.book;
  const commentHeight = 30;
  const containerHeight = store.screen.height - commentHeight;
  const sc = store.screen;
  const rs = Math.hypot(sc.width, sc.height) * (0.04 + 0.1 * store.responseSize / 100);
  var cbox: Box = {
    width: sc.width,
    height: containerHeight,
    left: 0,
    top: 0,
    align: 'v'
  };

  var rboxes: Array<Box> = []; // boxes for responses
  if (store.layout.left && rboxes.length < store.nresponses) {
    cbox.width -= rs;
    cbox.left = rs;
    rboxes.push({ top: 0, left: 0, height: cbox.height, width: rs, align: 'v' });
  }
  if (store.layout.right && rboxes.length < store.nresponses) {
    cbox.width -= rs;
    rboxes.push({ top: 0, left: sc.width - rs, height: cbox.height, width: rs, align: 'v'});
  }
  if (store.layout.top && rboxes.length < store.nresponses) {
    cbox.height -= rs;
    cbox.top = rs;
    rboxes.push({ top: 0, left: cbox.left, height: rs, width: cbox.width, align: 'h'});
  }
  if (store.layout.bottom && rboxes.length < store.nresponses) {
    cbox.height -= rs;
    rboxes.push({ top: containerHeight - rs, left: cbox.left, height: rs, width: cbox.width,
                  align: 'h'});
  }

  const containerStyle = {
    width: store.screen.width,
    height: store.screen.height - 30,
    top: commentHeight
  };

  function sayWord() {
    // response event
    console.log('response', store.word);
    store.firebaseEvent(
      store.teacherid,
      store.studentInitials,
      store.book.title,
      'RESPONSE ' + store.word
    );
    store.firebaseUsageEvent([{ attrName: 'number_response_events', attrValue: 1 }]);
    var msg = new SpeechSynthesisUtterance(store.word);
    msg.lang = 'en-US';
    speechSynthesis.speak(msg);
  }

  return (
    <div>
      <div className="comment" >{store.comment}</div>
      <div className="reading-container" style={containerStyle}>
        <ReaderContent box={cbox} book={book} pageno={store.pageno} store={store} />
        <Responses boxes={rboxes} responses={store.responses} store={store} doResponse={sayWord} />
        <Controls store={store} doResponse={sayWord}/>
      </div>
    </div>
  );
});

// Reader component
interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
  align: string;
}

interface ReaderContentProps {
  book: SharedBook;
  box: Box;
  pageno: number;
  store: Store;
}

const ReaderContent = observer(function ReaderContent(props: ReaderContentProps) {
  const {book, box, pageno, store} = props;
  const {width, height, top, left} = box; 
  const fontSize = width / height < 4 / 3 ? width / 36 : height / 36;
  let pageStyle = {
    width, height, top, left, fontSize
  };
  if (pageno > store.npages) {
    // past the end
    // finishReading, number_books_read events
    store.firebaseEvent(
      store.teacherid,
      store.studentInitials,
      store.book.title,
      'FINISH READING'
    );
    store.firebaseUsageEvent([
      { attrName: 'number_finish_reading_events', attrValue: 1 },
      { attrName: 'number_books_read', attrValue: 1 } 
    ]);

    return (
      <div className="book-page" style={pageStyle}>
        <h1 className="title">What would you like to do now?</h1>
        <div className="choices">
          <button 
            onClick={
              () => {
                store.setPage(1); 
                store.firebaseUsageEvent([
                  { attrName: 'number_books_opened', attrValue: 1}
                ]); 
              }
            }
          >
            Read this book again
          </button>
          <button 
            onClick={
              e => { 
                store.setIdPage('', 0); 
                document.body.style.background = 'linear-gradient(#967f8a, #404663) fixed'; 
              }
            }
          >
            Read another book
          </button>
          <button onClick={() => {window.location.href = 'https://tarheelreader.org/'; }}> 
            Go to Tar Heel Reader
          </button>
          <button 
            onClick={
              () => {
                store.setIdPage('', 0);
                store.setmode(1);
                document.body.style.background = 'linear-gradient(#967f8a, #404663) fixed';
              }}
          >
            Select another student
          </button>
          <button 
            onClick={
              () => { 
                store.logout(); 
                store.setIdPage('', 0); 
                document.body.style.background = 'linear-gradient(#967f8a, #404663) fixed';
              }}
          >
            Logout
          </button>
          <button onClick={() => location.reload()}>
            Refresh
          </button>
        </div>
      </div>
    );
  }
  const page = book.pages[pageno - 1];
  const textHeight = pageno === 1 ? 4 * fontSize + 8 : 6.5 * fontSize;
  const maxPicHeight = height - textHeight;
  const maxPicWidth = width;
  const verticalScale = maxPicHeight / page.height;
  const horizontalScale = maxPicWidth / page.width;
  let picStyle = {};
  if (verticalScale < horizontalScale) {
    picStyle = {
      height: maxPicHeight
    };
  } else {
    picStyle = {
      width: maxPicWidth,
      marginTop: pageno === 1 ? 0 : (maxPicHeight - horizontalScale * page.height)
    };
  }

  if (pageno === 1) {
    let titleStyle = {
      height: 4 * fontSize,
      fontSize: 2 * fontSize,
      padding: 0,
      margin: 0,
      display: 'block'
    };
    return (
      <div className="book-page" style={pageStyle}>
        <h1 className="title" style={titleStyle}>{book.title}</h1>
        <img 
         src={'https://tarheelreader.org' + book.pages[0].url} 
         className="pic" 
         style={picStyle}
         alt=""
        />
        <PageNavButtons store={store}/>
      </div>
    );
  } else {
    return (
      <div className="book-page" style={pageStyle}>
        <p className="page-number">{pageno}</p>
        <img
          src={'https://tarheelreader.org' + page.url}
          className="pic"
          style={picStyle}
          alt=""
        />
        <div className="caption-box">
          <p className="caption">{page.text}</p>
        </div>
        <PageNavButtons store={store}/>
      </div>
    );
  }
});

const PageNavButtons = observer(function PageNavButtons(props: {store: Store}) {
  if (props.store.pageTurnVisible) {
    return (
      <div>
        <button className="next-link" onClick={props.store.nextPage}>
          <img src={NextArrow} alt="next"/>Next
        </button>
        <button className="back-link" onClick={props.store.backPage}>
          <img src={BackArrow} alt="back"/>Back
        </button>
      </div>
    );
  } else {
    // This strange return value is keeping typescript happy 
    // https://github.com/Microsoft/TypeScript/wiki/What%27s-new-in-TypeScript#non-null-assertion-operator
    // We're asking it to ignore the possibility of returning null
    return null!;
  }
});

interface ResponsesProps {
  store: Store;
  boxes: Array<Box>;
  responses: Array<string>;
  doResponse: () => void;
}

const Responses = observer(function Responses(props: ResponsesProps) {
  const {store, boxes, responses, doResponse } = props;
  var words = responses;
  var index = 0;
  const responseGroups = boxes.map((box, i) => {
    const nchunk = Math.max(1, Math.floor(words.length / (boxes.length - i)));
    const chunk = words.slice(0, nchunk);
    words = words.slice(nchunk);
    const { pax, sax } = {'v': { pax: 'height', sax: 'width' },
                          'h': { pax: 'width', sax: 'height' }}[box.align];
    var bstyle = {};
    bstyle[pax] = box[pax] / nchunk;
    bstyle[sax] = box[sax];
    const dstyle = { top: box.top, left: box.left, width: box.width, height: box.height };
    const responseGroup = chunk.map((w, j) => (
      <ResponseButton
        key={w}
        word={w}
        index={index++}
        style={bstyle}
        store={store}
        doResponse={doResponse}
      />
    ));
    return (
      <div key={i} style={dstyle} className="response-container">
        {responseGroup}
      </div>
    );
  });
  return <div>{responseGroups}</div>;
});

interface ResponseButtonProps {
  word: string;
  index: number;
  style: React.CSSProperties;
  store: Store;
  doResponse: () => void;
}

const ResponseButton = observer(function ResponseButton(props: ResponseButtonProps) {
  const { word, index, style, store, doResponse } = props;
  const maxSize = Math.min(style.width, style.height);
  const fontSize = maxSize / 5;
  const iconSize = maxSize - fontSize - 10;
  const iStyle = {
    width: iconSize
  };
  const cStyle = {
    fontSize,
    marginTop: -fontSize / 4
  };
  const isFocused = store.responseIndex === index;
  return (
    <button
      className={`${isFocused ? 'selected' : ''}`}
      onClick={() => doResponse()}
      style={style}
      onFocus={(e) => store.setResponseIndex(index)}
    >
      <figure>
        <img
          src={process.env.PUBLIC_URL + '/symbols/' + word + '.png'}
          alt={word}
          style={iStyle}
        />
        <figcaption style={cStyle}>{word}</figcaption>
      </figure>
    </button>
  );
});

interface ControlsProps {
  store: Store;
  doResponse: () => void;
}

const Controls = observer(function Controls(props: ControlsProps) {
  const { store, doResponse } = props;
  const customStyles = {
    content : {
      top                   : '50%',
      left                  : '50%',
      right                 : 'auto',
      bottom                : 'auto',
      marginRight           : '-50%',
      transform             : 'translate(-50%, -50%)'
    },
    overlay: {
      backgroundColor   : 'rgba(255, 255, 255, 0.0)'
    }
  };

  return (
    <div>
      <NRKeyHandler
        keyValue={'ArrowRight'}
        onKeyHandle={store.nextPage}
      />
      <NRKeyHandler
        keyValue={'ArrowLeft'}
        onKeyHandle={store.backPage}
      />
      <NRKeyHandler
        keyValue={' '}
        onKeyHandle={store.nextResponseIndex}
      />
      <NRKeyHandler
        keyValue={'Enter'}
        onKeyHandle={doResponse}
      />
      <NRKeyHandler
        keyValue="Escape"
        onKeyHandle={store.toggleControlsVisible}
      />
      <Modal 
        isOpen={store.controlsVisible}
        contentLabel="Reading controls"
        style={customStyles}
      >
        <div className="controls">
          <h1>Reading controls</h1>
          <label>Reading:&nbsp; 
            <ReadingSelector
              value={store.reading}
              max={store.nreadings}
              set={store.setReading}
            />
          </label>
          <Layout store={store} />
          <label>Size:&nbsp;
            <input
              type="range"
              min="0"
              max="100"
              value={store.responseSize}
              onChange={e => store.setResponseSize(+e.target.value)}
            />
          </label>
          <label>Page Navigation:&nbsp;
            <input
              type="checkbox"
              checked={store.pageTurnVisible}
              onChange={store.togglePageTurnVisible}
            />
          </label>

          <button onClick={store.toggleControlsVisible}>
            Done
          </button>
        </div>
      </Modal>
    </div>
  );
});

interface NRKeyHandlerProps {
  keyValue: string;
  onKeyHandle: (e: Event) => void;
}

@observer
class NRKeyHandler extends React.Component<NRKeyHandlerProps, {}> {
  isDown = false;
  keyDown = (e: Event) => {
    e.preventDefault();
    if (!this.isDown) {
      this.isDown = true;
      this.props.onKeyHandle(e);
    }
  }
  keyUp = (e: Event) => {
    this.isDown = false;
  }
  render() {
    const keyValue = this.props.keyValue;
    return (
      <div>
        <KeyHandler
          keyEventName={'keydown'}
          keyValue={keyValue}
          onKeyHandle={this.keyDown}
        />
        <KeyHandler
          keyEventName={'keyup'}
          keyValue={keyValue}
          onKeyHandle={this.keyUp}
        />
      </div>
    );
  }
}

interface ReadingSelectProps {
  value: number;
  max: number;
  set: (value: number) => void;
}

const ReadingSelector = observer(function ReadingSelector(props: ReadingSelectProps) {
  const { value, max, set } = props;
  const spelled = [ 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth',
                    'eleventh', 'twelth' ];
  const options = spelled.slice(0, max).map((option, i) => (
    <option key={option} value={i} >{option}</option>));
  return (
    <select value={value} onChange={(e) => set(+e.target.value)}>
      {options}
    </select>
  );
});
  
function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const Layout = observer(function Layout(props: {store: Store}) {
  const store = props.store;
  const sides = ['left', 'right', 'top', 'bottom'];
  const onCheck = (e: React.FormEvent<HTMLInputElement>) =>
    store.setLayout(e.currentTarget.name, e.currentTarget.checked);
  return (
    <fieldset>
      <legend>Layout</legend>
      {
        sides.map(side => (
          <label key={side}>{capitalize(side)}:
            <input
              name={side}
              type="checkbox"
              checked={store.layout[side]}
              onChange={onCheck}
            />
          </label>))
      }
    </fieldset>);
});

export default Reader;
