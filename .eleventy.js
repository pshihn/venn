const syntaxHighlightPlugin = require("@11ty/eleventy-plugin-syntaxhighlight");

module.exports = function (eleventyConfig) {
  // syntax highlighting plugin
  eleventyConfig.addPlugin(syntaxHighlightPlugin, {
    templateFormats: 'md'
  });
  // Folders to copy to output folder
  eleventyConfig.addPassthroughCopy('images');
  eleventyConfig.addPassthroughCopy('css');
  eleventyConfig.addPassthroughCopy('scripts');

  return {
    dir: {
      output: "docs"
    }
  }
};