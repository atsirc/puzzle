(function (win, doc, obj) {
    const containerClass = "puzzle-container";
    const pscContainerClass = "image-container";
    const finishedClass = "finished";
    const pscContainerParent = obj.puzzlePiecesContainer;
    const puzzleContainer = obj.finishedPuzzleContainer;
    let rows = obj.rows;
    let cols = obj.cols;
    let imgUrl = obj.imgUrl;
    let imgSize = { width: 0, height: 0 };
    
    function changeRows(e) {
        //rows = this.value;
        rows = e.target.value;
        setupStyles();
    }
    
    function changeColumns(e) {
        //cols = this.value;
        cols = e.target.value;
        setupStyles();
    }
    
    function setUrl(e) {
        let reader = new FileReader();
        const file = e.srcElement.files[0];
        reader.onload = function(ev) {
            imgUrl = ev.target.result;
            setupSizing(setupStyles);
        }
        reader.readAsDataURL(file);
    }
    
    function getNewImgSize(imgW, imgH) {
        const maxWidth = .90 * win.innerWidth / 2;
        const maxHeight = .85 * win.innerHeight;
        if ( !(imgW < maxWidth && imgH < maxHeight) )  {
            if (imgW / maxWidth > imgH / maxHeight ) {
                imgH *= maxWidth / imgW;
                imgW = maxWidth;
              //  perc = maxWidth / imgW;
                
            }
            if (imgH / maxHeight > imgW / maxWidth ) {
                imgW *= maxHeight / imgH;
                imgH = maxHeight;
            }
        }        
        return { width: imgW, height: imgH };    
    }
    
    function setupSizing(callback) {
        let img = new Image();
        img.onload = function() {
            let resizedImg = getNewImgSize(this.width, this.height);
            imgSize = resizedImg;
            callback();
        };
        img.src = imgUrl;
    }
    
    function setPieceStyle(){
        let foundStyle, piece = {};
        let style = doc.getElementById("piece-size");
        if (style === null) {
            foundStyle = false;
            style = doc.createElement("style");
            style.setAttribute("id", "piece-size");
        }
        piece.width = imgSize.width / cols;
        piece.height = imgSize.height / rows;
        style.innerHTML = '.' + pscContainerClass +' {\nwidth: ' + piece.width + 'px;\nheight: ' + piece.height + 'px;\n}';
        if (!foundStyle) {
            let head = doc.getElementsByTagName('head');
            head[0].appendChild(style);
        }
    }
    
    function setupContainers() {
        let foundStyle;
        let style = doc.getElementById("container-size");
        if (style === null) {
            foundStyle = false;
            style = doc.createElement('style');
            style.setAttribute('id', 'container-size');
        }
        // + 1 är för att motverka en form av felräkning som verkar ske i firefox
        style.innerHTML = '.' + containerClass + ' {\nwidth: ' + (imgSize.width + .5) + 'px;\nheight: ' + (imgSize.height + .5) + 'px;\n}';
        if (!foundStyle) {
            let head = doc.getElementsByTagName('head');
            head[0].appendChild(style);                   
        }
    }

    //I'm of course lazy, used this one: https://bost.ocks.org/mike/shuffle/
    function shuffle(array) {
      var m = array.length, t, i;

      while (m) {
        i = Math.floor(Math.random() * m--);
        t = array[m];
        array[m] = array[i];
        array[i] = t;
      }

      return array;
    }
    
    function generatePuzzlePieces() {
        let parent = doc.getElementById(pscContainerParent);
        parent.innerHTML = "";

        let bitar = [];
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                let div = doc.createElement('div');
                div.className = pscContainerClass;
                div.setAttribute('id', 'bit' + (i * cols + j));
                div.setAttribute('draggable', true); 
                div.addEventListener('dragstart', drag);
                div.style.backgroundImage = 'url("' + imgUrl + '")';
                div.style.backgroundPosition = 'left ' + (-j * imgSize.width / cols) + 'px top ' + (-i * imgSize.height / rows) + 'px';
                div.style.backgroundSize = imgSize.width  + "px";
                bitar.push(div);
            }
        }
        
        let blandadeBitar = shuffle(bitar);
        blandadeBitar.forEach(e => parent.appendChild(e));
    } 

    function generateEmptyPuzzlePieces() {
        let parent = doc.getElementById(puzzleContainer);
        parent.innerHTML = "";

        for (let i = 0; i < cols * rows; i++) {
            let div = doc.createElement('div');
            div.className = pscContainerClass;
            div.setAttribute('title', 'bit' + i);
            div.addEventListener('dragover', allowDrop);
            div.addEventListener('drop', dropDown);
            parent.appendChild(div);
        }
    }

    function drag(ev) {
        ev.dataTransfer.clearData();
        ev.dataTransfer.setData('text/plain', ev.target.id);
        //let container = this.offsetParent;
        let container = ev.target.parentElement;
        //only works in chrome:
        //let container = ev.path[1];

        if (container.className.indexOf(pscContainerClass) != -1) {
            if (container.className.indexOf(finishedClass) != -1) {
                container.className = pscContainerClass;
            }
        }
    }

    function allowDrop(ev) {
        ev.preventDefault();
    }

    function dropDown(ev) {
        if (ev.stopPropagation) {
            ev.stopPropagation();
        }
        var data = ev.dataTransfer.getData('text');

        //går inte med att räkna children... så måste hitta på ngt som den ena har, men den andra inte...
        if (ev.target.title !== '') {
            ev.target.appendChild(doc.getElementById(data)); 
            if (ev.target.title === data) {
               ev.target.className += " " + finishedClass;
            }
        }
        ev.preventDefault();
    }

    function returnElement(ev) {
        ev.preventDefault();
        if (ev.stopPropagation) {
            ev.stopPropagation();
        }

        let data = ev.dataTransfer.getData('text');
        ev.target.appendChild(doc.getElementById(data));
    }
    
    function setupStyles() {
        setPieceStyle();
        setupContainers();
        generatePuzzlePieces();
        generateEmptyPuzzlePieces();
    }
    
    function init() {
        setupSizing(setupStyles);
        
        doc.getElementById(obj.fileLoaderId).addEventListener('change', setUrl, false);
        doc.getElementById(obj.rowId).addEventListener('change', changeRows, false);
        doc.getElementById(obj.columnsId).addEventListener('change', changeColumns, false);
        
        //fullständigt onödigt, men är i princip till för att man skulle kunna lösgöra pusslet (med style-fil då) från html-dokumentet... halvfärdig idé obviously
        doc.getElementById(puzzleContainer).className = containerClass;
        doc.getElementById(pscContainerParent).className = containerClass;
        
        //så att man kan sätta tillbaka bitar i divven
        let pcsParent = doc.getElementById(pscContainerParent);        
        pcsParent.addEventListener('dragover', allowDrop, false);
        pcsParent.addEventListener('drop', returnElement, false); 
    }
    
    return init();
    
})(window, document, {
    fileLoaderId: "file",
    rowId: "rows",
    columnsId: "columns",
    finishedPuzzleContainer: "pussel",
    puzzlePiecesContainer: "bitar",
    rows: 5,
    cols: 5,
    imgUrl: "old_russian_dog.jpg"
});