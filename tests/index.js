'use strict'

const test = require('tape')
const fs = require('fs')
const del = require('del')
const pouchdb = require('pouchdb-node')
  .defaults({prefix: '/tmp/eventStore/'})

const eventStoreFactory = require('../index')

del.sync(['/tmp/eventStore'], {force: true})
fs.mkdirSync('/tmp/eventStore')

let lastId = 0

const viewModelDb = pouchdb('viewModel')
const options = {
  pouchdb: pouchdb('events'),
  idGenerator: {
    next () { return new Promise((resolve, reject) => { resolve(++lastId) }) }
  },
  viewModels: [
    {
      pouchdb: viewModelDb,
      reducer (state, event) {
        if (!state.items) state.items = []
        state.items.push(event)
        return state
      }
    }
  ]
}

test('create new', (assert) => {
  eventStoreFactory(options).create()
    .then((eventStore) => eventStore.add({type: 'CREATE'}, 123))
    .then((result) => {
      assert.equal(result.id, '1')
      assert.end()
    })
    .catch((error) => assert.error(error))
})

test('create new callback style', (assert) => {
  eventStoreFactory(options).create((error, eventStore) => {
    if (error) return assert.error(error)
    eventStore.add({type: 'CREATE'}, 123, (error, result) => {
      if (error) return assert.error(error)
      assert.equal(result.id, '2')
      assert.end()
    })
  })
})

test('read eventstore', (assert) => {
  eventStoreFactory(options).get('1')
    .then((eventStore) => {
      assert.equal(eventStore.getId(), '1')
      assert.equal(eventStore.getEvents().length, 1)
      assert.end()
    })
    .catch((error) => assert.error(error))
})

test('read eventstore callback style', (assert) => {
  eventStoreFactory(options).get('2', (error, eventStore) => {
    if (error) return assert.error(error)

    assert.equal(eventStore.getId(), '2')
    assert.equal(eventStore.getEvents().length, 1)
    assert.end()
  })
})

test('read viewModel', (assert) => {
  viewModelDb.get('1')
    .then((viewModel) => {
      assert.equal(viewModel._id, '1')
      assert.equal(viewModel.items.length, 1)
      assert.end()
    })
    .catch((error) => assert.error(error))
})
