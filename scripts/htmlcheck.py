"""G2 html smoke: parse every *.html in the repo with html.parser and report
unclosed or mismatched tags. Run: python scripts/htmlcheck.py"""
import sys
from html.parser import HTMLParser
from pathlib import Path

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link",
        "meta", "param", "source", "track", "wbr"}

class Checker(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.errors = []

    def handle_starttag(self, tag, attrs):
        if tag not in VOID:
            self.stack.append((tag, self.getpos()))

    def handle_startendtag(self, tag, attrs):
        pass

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if not self.stack:
            self.errors.append(f"stray </{tag}> at {self.getpos()}")
            return
        if self.stack[-1][0] == tag:
            self.stack.pop()
        else:
            open_tags = [t for t, _ in self.stack]
            if tag in open_tags:
                while self.stack and self.stack[-1][0] != tag:
                    t, pos = self.stack.pop()
                    self.errors.append(f"unclosed <{t}> opened at {pos}, closed implicitly by </{tag}> at {self.getpos()}")
                self.stack.pop()
            else:
                self.errors.append(f"unexpected </{tag}> at {self.getpos()}, no matching open tag")

def main():
    root = Path(__file__).resolve().parent.parent
    files = sorted(root.rglob("*.html"))
    fail = 0
    print("== G2 html smoke (html.parser unclosed-tag check) ==")
    for f in files:
        c = Checker()
        c.feed(f.read_text(encoding="utf-8"))
        c.close()
        leftover = [f"unclosed <{t}> opened at {pos}" for t, pos in c.stack]
        errs = c.errors + leftover
        if errs:
            fail += 1
            print(f"FAIL {f.relative_to(root)}")
            for e in errs:
                print(f"     {e}")
        else:
            print(f"OK   {f.relative_to(root)}")
    print(f"\nresult: {'PASS' if fail == 0 else f'FAIL ({fail} file(s) with problems)'}")
    sys.exit(0 if fail == 0 else 1)

if __name__ == "__main__":
    main()
