// ==UserScript==
// @name         Wordforge
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Replaces text with customizable case sensitivity per rule
// @author       Your name
// @match        https://etherreads.com/*
// @match        https://www.webnovel.com/*
// @match        https://booktoki466.com/*
// @match        https://www.fanmtl.com/*
// @grant        none
// ==/UserScript==

(() => {
    'use strict';

    class TextReplacer {
        constructor(rules = []) {
            this.rules = rules.filter(rule => rule.enable);
            this.compiledRules = this.compileRules();
            this.observer = null;
        }

        escapeRegExp(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        compileRules() {
            return this.rules.map(({ oldWord, newWord, caseSensitive }) => {
                const regex = new RegExp(this.escapeRegExp(oldWord), caseSensitive ? 'g' : 'gi');
                return { regex, newWord };
            });
        }

        replaceText(text) {
            let result = text;
            for (const { regex, newWord } of this.compiledRules) {
                result = result.replace(regex, newWord);
            }
            return result;
        }

        processNode(node) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                const originalText = node.textContent;
                const replacedText = this.replaceText(originalText);
                if (originalText !== replacedText) {
                    node.textContent = replacedText;
                }
            } else if (
                node.nodeType === Node.ELEMENT_NODE &&
                    !['SCRIPT', 'STYLE', 'TEXTAREA'].includes(node.tagName)
            ) {
                const children = Array.from(node.childNodes);
                for (let i = 0, len = children.length; i < len; i++) {
                    this.processNode(children[i]);
                }
            }
        }

        startObserving() {
            this.observer = new MutationObserver(mutations => {
                const nodesToProcess = new Set();
                mutations.forEach(({ addedNodes }) => {
                    for (let i = 0, len = addedNodes.length; i < len; i++) {
                        nodesToProcess.add(addedNodes[i]);
                    }
                });

                nodesToProcess.forEach(node => this.processNode(node));
            });

            this.observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        init() {
            try {
                this.processNode(document.body);
                this.startObserving();
                return true;
            } catch (error) {
                console.error('TextReplacer initialization failed:', error || 'Unknown Error');
                return false;
            }
        }

        dispose() {
            this.observer?.disconnect();
            this.observer = null;
        }
    }

    const rules = [
        { oldWord: 'Rosvitha', newWord: 'Rossweisse', caseSensitive: false, enable: true },
        { oldWord: 'oldWord2', newWord: 'newWord2', caseSensitive: true, enable: false }
    ];

    const initialize = () => new TextReplacer(rules).init();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();

