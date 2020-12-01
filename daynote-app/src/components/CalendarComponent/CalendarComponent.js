import React, {Component} from 'react';
import axios from 'axios';
import AddEventModalComponent from "../ModalComponents/AddEventModalComponent";
import AddNoteModalComponent from "../ModalComponents/AddNoteModalComponent";
import EditEventModalComponent from "../ModalComponents/EditEventModalComponent";
import { Link } from 'react-router-dom';
import '../../App.css';

export default class CalendarComponent extends Component {
    constructor(props) {
        super(props);

        this.getMonthString = this.getMonthString.bind(this);
        this.organizeMonthEvents = this.organizeMonthEvents.bind(this);
        this.getMonthNotes = this.getMonthNotes.bind(this);
        this.getEvents = this.getEvents.bind(this);
        this.getNotes = this.getNotes.bind(this);
        this.fetchData = this.fetchData.bind(this);
        this.addNote = this.addNote.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.toggleDailyNotes = this.toggleDailyNotes.bind(this);
        this.updateDailyNoteCells = this.updateDailyNoteCells.bind(this);

        this.state = {
            // Store the date of the current calendar view
            // Store the current month's events and daily notes
            events: [],
            notes: [],
            // When daily note clicked, modal should open and we store
            //   the noteId and noteDate (to pass to the modal)
            showNoteModal: "",
            noteId: null,
            noteDate: "",
            showEventModal: "",
            eventId: null,
            eventDate: ""
        };
    }

    // Retrieves month's events and notes and stores them in state
    componentDidMount() {
        this.fetchData();
    }

    componentDidUpdate(prevProps, prevState) {
        // Makes sure previously opened notes remain visible once a note is updated
        this.updateDailyNoteCells();
        // If the month has been changed, fetch events and notes
        if(prevProps.month !== this.props.month) {
            this.fetchData();
        }
    }

    // Opens/closes a week's notes
    toggleDailyNotes(index) {
        // Arrow animation
        let arrows = document.getElementsByClassName("toggle-notes");
        arrows[index].classList.toggle("toggled");
        // Shows/hides row of notes
        let panels = document.getElementsByClassName("panel");
        let descendants = panels[index].getElementsByTagName("*");
        if(!panels[index].classList.contains("show-note")) {
            panels[index].classList.add("show-note");
            for(let i = 0; i<descendants.length; i++) {
                descendants[i].classList.add("show-note");
            }
        }
        else {
            panels[index].classList.remove("show-note");
            for(let i = 0; i<descendants.length; i++) {
                descendants[i].classList.remove("show-note");
            }
        }
    }

    // Makes sure previously opened notes remain visible once a note is updated
    updateDailyNoteCells() {
        let arrows = document.getElementsByClassName("toggle-notes");
        for(let i = 0; i<arrows.length; i++) {
            arrows[i].classList.remove("toggled");
        }

        let panels = document.getElementsByClassName("panel");
        for(let i = 0; i<panels.length; i++) {
            let descendants = panels[i].getElementsByTagName("*");
            if(panels[i].classList.contains("show-note")) {
                for(let i = 0; i<descendants.length; i++) {
                    descendants[i].classList.add("show-note");
                }
            }
            else {
                for(let i = 0; i<descendants.length; i++) {
                    descendants[i].classList.remove("show-note");
                }
            }
        }
    }

    // Fetches month's events and daily notes
    fetchData() {
        this.setState({
            events: [],
            notes: []
        });

        let monthYear = "" + (this.props.month+1) + this.props.year;
        axios.get('http://localhost:4000/events/getMonth/'+monthYear)
            .then(response => {
                if(response.data) {
                    this.setState(state => {
                        const obj = response.data.events;
                        const fetchedEvents = state.events.concat(obj);
                   
                        return {
                          events: fetchedEvents
                        };
                      });
                }
            })
            .catch(function (error) {
                console.log(error);
            })

        axios.get('http://localhost:4000/DailyNotes/getMonth/'+monthYear)
            .then(response => {
                if(response.data) {
                    this.setState(state => {
                        const obj = response.data;
                        const fetchedNotes = state.notes.concat(obj.dailyNotes);
                   
                        return {
                            notes: fetchedNotes
                        };
                      });
                }
            })
            .catch(function (error) {
                console.log(error);
            })
    }

    // Returns a string for time
    getTime(date) {
        let hours = date.getHours();
        let midday;
        if(hours > 12) {
            midday = "pm";
            hours -= 12;
        }
        else if(hours === 0) {
            hours = 12;
            midday = "am";
        }
        else {
            midday = "am";
        }
        let minutes = date.getMinutes();
        if(minutes < 10) {
            minutes = "0" + minutes;
        }
        let time;
        if(minutes > 0) {
            time = hours + ":" + minutes + midday;
        }
        else {
            time = hours + midday;
        }
        return time;
    }

    // Returns events for the given date
    getEvents(date, monthEvents) {
        const key = date.getDate()-1;
        let events = [];
        for(let i = 0; i<monthEvents[key].length; i+=2) {
            let message = "";
            if(monthEvents[key][i+1] === "S") {
                let startDate = new Date(monthEvents[key][i].event_start);
                let time = this.getTime(startDate);
                message =  " at " + time;
            }
            else if(monthEvents[key][i+1] === "E") {
                message = " Ends";
            }
            let monthYear = "" + (this.props.month+1) + this.props.year; 
            //events.push(<Link to={"/edit/"+monthYear+monthEvents[key][i]._id} key={i} className={"colour-"+monthEvents[key][i].event_colour}>{monthEvents[key][i].event_title}{message}</Link>);
            events.push(<div key={i} className={"colour-"+monthEvents[key][i].event_colour + " event"} onClick={() => this.editEvent(monthEvents[key][i], new Date(this.props.year, this.props.month, key+1))}>{monthEvents[key][i].event_title}{message}</div>)
        }
        return <div key={key}>{events}</div>;
    }

    // Places events into an array where length of array = # of days in month
    //   pushes "S" or "E" afterwards depending on if event is starting or ending
    organizeMonthEvents(totalDays) {
        let monthEvents = [];
        for(let i = 0; i<totalDays; i++) {
            let events = [];
            monthEvents.push(events);
        }

        let currentDate = new Date(this.props.year,this.props.month,this.props.day);

        this.state.events.map(function(currentEvent, i) {
            let eventStartDate = new Date(currentEvent.event_start);
            let eventEndDate = new Date(currentEvent.event_end);
            eventStartDate.setHours(0,0,0,0);
            eventEndDate.setHours(0,0,0,0);

            if(eventStartDate.getFullYear() === currentDate.getFullYear() && eventStartDate.getMonth() === currentDate.getMonth()) {
                monthEvents[eventStartDate.getDate()-1].push(currentEvent);
                monthEvents[eventStartDate.getDate()-1].push("S");
            }
            if(eventEndDate.getFullYear() === currentDate.getFullYear() && eventEndDate.getMonth() === currentDate.getMonth()) {
                if(eventStartDate.getDate() !== eventEndDate.getDate()) {
                    monthEvents[eventEndDate.getDate()-1].push(currentEvent);
                    monthEvents[eventEndDate.getDate()-1].push("E");
                }
            }
        });

        return monthEvents;
    }

    // Returns the note for a date
    getNotes(date, monthNotes) {
        const key = date.getDate()-1;
        let notes = [];
        if(monthNotes[key] !== null && typeof monthNotes[key] === 'object') {
            notes.push(<div key={key} dangerouslySetInnerHTML={{ __html: monthNotes[key].note_text }}></div>);
        }
        return <div key={key}>{notes}</div>;
    }

    // Looks at this.state.notes and returns the notes for the current month
    getMonthNotes(totalDays) {
        let monthNotes = [];
        for(let i = 0; i<totalDays; i++) {
            monthNotes.push(null);
        }

        let currentDate = new Date(this.props.year,this.props.month,this.props.day);

        this.state.notes.map(function(currentNote, i) {
            let noteStartDate = new Date(currentNote.note_date);
            noteStartDate.setHours(0,0,0,0);

            if(noteStartDate.getFullYear() === currentDate.getFullYear() && noteStartDate.getMonth() === currentDate.getMonth()) {
                monthNotes[noteStartDate.getDate()-1] = currentNote;
            }
        });

        return monthNotes;
    }

    // Creates entire calendar table by retrieving events/notes then pushing cells into calendar 2D array
    renderDates = () => {
        let calendar = [];

        let curDate = new Date(this.props.year,this.props.month+1,this.props.day);
        let firstDay = new Date(curDate.getFullYear(), curDate.getMonth()-1, 1);
        let lastDay = new Date(curDate.getFullYear(), curDate.getMonth(), 0);

        let numDays = lastDay.getDate();
        let startDay = firstDay.getDay();
        let daysLeft = startDay;
        let totalDays = numDays + startDay;

        let monthEvents = this.organizeMonthEvents(totalDays);
        let monthNotes = this.getMonthNotes(totalDays);

        for (let i = 0; i < (totalDays/7); i++) {
            let children = [];
            let childrenNotes = [];

            children.push(<td key={-1} className="date-cell p-0 text-center align-middle"><img src="assets/down-arrow.svg" alt="" className="toggle-notes" onClick={() => this.toggleDailyNotes(i)} /></td>);
            childrenNotes.push(<td key={-1} className="note-cell p-0 bg-transparent"></td>);

            for (let j = 0; j < 7; j++) {
                if(daysLeft) {
                    children.push(<td key={j} className="date-cell py-0"></td>);
                    childrenNotes.push(<td key={j} className="note-cell py-0"></td>);
                    daysLeft--;
                }
                else {
                    if(numDays) {
                        let date = i * 7 + (j - startDay + 1);
                        children.push(<td key={date + 7} className="date-cell py-0">{`${date}`}<br/>{this.getEvents(new Date(this.props.year,this.props.month,date),monthEvents)}</td>);
                        
                        // TODO: TEST THIS
                        // If a note entry exists → scroll to the daily note
                        if(monthNotes[date-1]) {
                            childrenNotes.push(<td key={date + 7} className="note-cell active-note-cell py-0"><a href={"#"+date}>{this.getNotes(new Date(this.props.year,this.props.month,date),monthNotes)}</a></td>);
                        }
                        // Otherwise → add daily note
                        else {
                            childrenNotes.push(<td key={date + 7} className="note-cell active-note-cell py-0"><Link to={"/addDailyNote/"+date}>{this.getNotes(new Date(this.props.year,this.props.month,date),monthNotes)}</Link></td>);
                        }
                        numDays--;
                    }
                    else {
                        children.push(<td key={curDate + j} className="date-cell py-0"></td>);
                        childrenNotes.push(<td key={curDate + j} className="note-cell py-0"></td>);
                    }
                }
            }
            calendar.push(<tr key={i}>{children}</tr>);
            calendar.push(<tr key={i+(totalDays/7)} className="panel">{childrenNotes}</tr>);
        }

        return calendar;
    }
    
    // Month number to month string
    getMonthString(month) {
        const months = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
        return months[month];
    }

    // addNote updates note modal state fields to pass as props to AddNoteModalComponent
    //   note is an array containing at most one note object
    addNote(note,date) {
        if(note.length !== 0) {
            // A note already exists, we edit
            this.setState({
                showNoteModal: "show-events-modal",
                noteDate: date,
                noteId: note[0]._id
            })
        }
        else {
            this.setState({
                showNoteModal: "show-events-modal",
                noteDate: date,
                noteId: null
            })
        }
    }

    editEvent(event,date) {
        this.setState({
            showEventModal: "show-events-modal",
            eventDate: date,
            eventId: event._id
        })
    }

    // Closes the note modal
    closeModal() {
        this.setState({
            showNoteModal: "",
            showEventModal: ""
        })
    }

    render() {
        return(
            <div>
                <div className="d-flex justify-content-between">
                    <div>
                        <p className="text-center month">{`${this.getMonthString(this.props.month)} ${this.props.year}`}</p>
                    </div>
                    <div className="d-flex align-items-center">
                        <AddEventModalComponent updateEvents={this.fetchData} />
                    </div>
                    <div className="d-flex align-items-center">
                        <div className="today-button" onClick={this.props.goToToday}>Today</div>
                        <img className="prev-month" src="assets/left-arrow.svg" onClick={this.props.prevMonth} />
                        <img className="next-month" src="assets/right-arrow.svg" onClick={this.props.nextMonth} />
                    </div>
                </div>
                
                <AddNoteModalComponent noteId={this.state.noteId} noteDate={this.state.noteDate} showModal={this.state.showNoteModal} closeModal={this.closeModal} updateEvents={this.fetchData} />
                <EditEventModalComponent eventId={this.state.eventId} eventDate={this.state.eventDate} showModal={this.state.showEventModal} closeModal={this.closeModal} updateEvents={this.fetchData} />

                <table className="table table-borderless calendar">
                    <thead>
                        <tr>
                            <th scope="col" className="note-col"></th>
                            <th scope="col">Sunday</th>
                            <th scope="col">Monday</th>
                            <th scope="col">Tuesday</th>
                            <th scope="col">Wednesday</th>
                            <th scope="col">Thursday</th>
                            <th scope="col">Friday</th>
                            <th scope="col">Saturday</th>
                        </tr>
                    </thead>
                    <tbody>
                        { this.renderDates() }
                    </tbody>
                </table>
            </div>
        );
    }
}