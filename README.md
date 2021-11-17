# Venny

Venny is a set of custom elements used to show Venn Diagrams on a web page. These Web Components are framework indepenedent and can easily be used with any framework or in markdown. 

Venny is based on [venn.js](https://github.com/benfred/venn.js/) which provides the algorithms to layout area proportional Venn and Euler diagrams. 


## Usage

In your HTML you can import the library and just use the `venn-` elements in your HTML

For example:
```html
<script type="module" src="https://unpkg.com/venny?module"></script>

<venn-diagram>
  <venn-set name="A" label="Apples"></venn-set>
  <venn-set name="B" label="Oranges"></venn-set>
  <venn-n sets="A B" label="Fruit"></venn-n>
</venn-diagram>
```
will create:
<img width="555" alt="Screen Shot 2021-11-17 at 3 38 18 PM" src="https://user-images.githubusercontent.com/833927/142299606-43ce9740-5922-47fd-a6be-dbdf79976237.png">

You can also import Venny in your JavaScript project from NPM

```
npm install venny -s
```

### Website 

More usage and examples on this website: [Venny](https://roughjs.com)

## API

Venny is a set of **three components**: `venn-diagram` is the container. `venn-set` represents a set or, visually a circle. `venn-n` describes intersection of sets. 

### venn-diagram

