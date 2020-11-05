const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const routes = express.Router();
const routes2 = express.Router();
const PORT = 4000;

let Note = require('./note.model');
let Event = require('./event.model');

app.use(cors());
app.use(bodyParser.json());

mongoose.connect('mongodb://127.0.0.1:27017/notes', { useNewUrlParser: true });
const connection = mongoose.connection;

connection.once('open', function() {
    console.log("MongoDB database connection established successfully");
})

routes.route('/').get(function(req,res) {
    Note.find(function(err,notes) {
        if(err) {
            console.log(err);
        }
        else {
            res.json(notes);
        }
    });
});

routes.route('/:id').get(function(req,res) {
    let id = req.params.id;
    Note.findById(id, function(err, note) {
        res.json(note);
    });
});

/*routes.route('/delete/:id').post(function(req,res) {
    let id = req.params.id;
    Note.remove({id: id})
    .then(notes => {
        res.status(200).json({'note': 'note deleted successfuly'});
    });
});*/

routes.route('/addNote').post(function(req,res) {
    let note = new Note(req.body);
    note.save()
        .then(note => {
            res.status(200).json({'note': 'note added successfuly'});
        })
        .catch(err => {
            res.status(400).send('adding new note failed');
        });
});

app.use('/notes', routes);

app.listen(PORT, function() {
    console.log("Server is running on Port: " + PORT);
});

routes2.route('/').get(function(req,res) {
    Event.find(function(err,events) {
        if(err) {
            console.log(err);
        }
        else {
            res.json(events);
        }
    });
});

routes2.route('/:id').get(function(req,res) {
    let id = req.params.id;
    Event.findById(id, function(err, event) {
        res.json(event);
    });
});

routes2.route('/addEvent').post(function(req,res) {
    let event = new Event(req.body);
    event.save()
        .then(event => {
            res.status(200).json({'event': 'event added successfuly'});
        })
        .catch(err => {
            res.status(400).send('adding new event failed');
        });
});

routes2.route('/update/:id').post(function(req,res) {
    Event.findById(req.params.id, function(err, event) {
        if(!event) {
            res.status(404).send('data is not found');
        }
        else {
            event.event_title = req.body.event_title;
            event.event_start = req.body.event_start;
            event.event_end = req.body.event_end;
            event.event_colour = req.body.event_colour;  

            event.save().then(event => {
                res.json('Event updated');
            })
            .catch(err => {
                res.status(400).send("Update not possible");
            });
        }
    });
});

routes2.route('/remove/:id').delete(function(req,res) {
    Event.findByIdAndRemove(req.params.id, (err, event) => {
        if (err) return res.status(500).send(err);
        const response = {
            message: "Event successfully deleted",
            id: req.params.id
        };
        return res.status(200).send(response);
    });
});

app.use('/events', routes2);