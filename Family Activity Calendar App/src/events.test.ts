import assert from "node:assert/strict"
import { test } from "node:test"
import { layoutLanes, personFromTitle } from "./events.ts"

test("personFromTitle finds the family member in the title", () => {
  assert.deepEqual(personFromTitle("Mia: Piano"), {
    person: "Mia",
    title: "Piano",
  })
  assert.deepEqual(personFromTitle("leo - Football"), {
    person: "Leo",
    title: "Football",
  })
  assert.deepEqual(personFromTitle("Dentist for Dad"), {
    person: "Dad",
    title: "Dentist for Dad",
  })
  assert.equal(personFromTitle("Mom's late shift").person, "Mum")
})

test("personFromTitle uses the first name mentioned", () => {
  assert.equal(personFromTitle("Swimming Leo & Mia").person, "Leo")
})

test("personFromTitle treats events that name nobody as Family", () => {
  assert.deepEqual(personFromTitle("  Family lunch "), {
    person: "Family",
    title: "Family lunch",
  })
  // Names inside other words don't count.
  assert.equal(personFromTitle("Leopard exhibition").person, "Family")
  assert.equal(personFromTitle("Miami trip").person, "Family")
})

test("layoutLanes gives lone events the whole width", () => {
  assert.deepEqual(
    layoutLanes([
      { start: 9, duration: 1 },
      { start: 10, duration: 1 },
    ]),
    [
      { lane: 0, lanes: 1 },
      { lane: 0, lanes: 1 },
    ],
  )
})

test("layoutLanes puts overlapping events side by side", () => {
  assert.deepEqual(
    layoutLanes([
      { start: 17, duration: 2 },
      { start: 17.5, duration: 0.5 },
      { start: 18, duration: 1 },
    ]),
    [
      { lane: 0, lanes: 2 },
      { lane: 1, lanes: 2 },
      { lane: 1, lanes: 2 },
    ],
  )
})

test("layoutLanes keeps separate clusters separate and handles any input order", () => {
  const lanes = layoutLanes([
    { start: 14, duration: 1 },
    { start: 9, duration: 2 },
    { start: 9, duration: 1 },
    { start: 9.5, duration: 1 },
  ])
  assert.deepEqual(lanes[0], { lane: 0, lanes: 1 })
  assert.deepEqual(lanes[1], { lane: 0, lanes: 3 })
  assert.deepEqual(lanes[2], { lane: 1, lanes: 3 })
  assert.deepEqual(lanes[3], { lane: 2, lanes: 3 })
})
