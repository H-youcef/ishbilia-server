

class Tea{

  constructor(key) {
    this.SUGAR = 0x9E3779B9;
	  this.CUPS  = 32;
    this.UNSUGAR = 0xC6EF3720;
    this.S = [];

    this.hasKey = false;

    if(key == null || !key){
      console.log('Invalid key: Key was null');
      return;
    }

    if(typeof(key) !== typeof("")){
      console.log('Invalid key: Key was not a string');
      return;
    }

    if(key.length < 32){
      console.log('Invalid key: Length was less than 32');
      return;
    }
    
    let off = 0;
    let bytesArr = [];
    for(let i = 0; i < 32; i += 2){
      var s = '0x' + key[i] + key[i+1];
      bytesArr[off++] = parseInt(s);
    }

    off=0;
    for (let i=0; i < 4; i++) {
			this.S[i] = ((bytesArr[off++] & 0xff)) |
			((bytesArr[off++] & 0xff) <<  8) |
			((bytesArr[off++] & 0xff) << 16) |
			((bytesArr[off++] & 0xff) << 24);
    }
    this.hasKey = true;
  }

  // getBytesArray(str){
  //   var bytes = [];
  //   for (var i = 0; i < str.length; ++i) {
  //     var code = str.charCodeAt(i); 
  //     //bytes = bytes.concat([code & 0xff, code / 256 >>> 0]);
  //     bytes = bytes.concat([code]);
  //   }
  //   return bytes;
  // }

  toBytesArray(str) {
    var utf8 = [];
    for (var i=0; i < str.length; i++) {
        var charcode = str.charCodeAt(i);
        if (charcode < 0x80) utf8.push(charcode);
        else if (charcode < 0x800) {
            utf8.push(0xc0 | (charcode >> 6), 
                      0x80 | (charcode & 0x3f));
        }
        else if (charcode < 0xd800 || charcode >= 0xe000) {
            utf8.push(0xe0 | (charcode >> 12), 
                      0x80 | ((charcode>>6) & 0x3f), 
                      0x80 | (charcode & 0x3f));
        }
        // surrogate pair
        else {
            i++;
            // UTF-16 encodes 0x10000-0x10FFFF by
            // subtracting 0x10000 and splitting the
            // 20 bits of 0x0-0xFFFFF into two halves
            charcode = 0x10000 + (((charcode & 0x3ff)<<10)
                      | (str.charCodeAt(i) & 0x3ff));
            utf8.push(0xf0 | (charcode >>18), 
                      0x80 | ((charcode>>12) & 0x3f), 
                      0x80 | ((charcode>>6) & 0x3f), 
                      0x80 | (charcode & 0x3f));
        }
    }
    return utf8;
  }

  toString(data)
  {
    const extraByteMap = [ 1, 1, 1, 1, 2, 2, 3, 0 ];
    var count = data.length;
    var str = "";
    
    for (var index = 0;index < count;)
    {
      var ch = data[index++];
      if (ch & 0x80)
      {
        var extra = extraByteMap[(ch >> 3) & 0x07];
        if (!(ch & 0x40) || !extra || ((index + extra) > count))
          return null;
        
        ch = ch & (0x3F >> extra);
        for (;extra > 0;extra -= 1)
        {
          var chx = data[index++];
          if ((chx & 0xC0) != 0x80)
            return null;
          
          ch = (ch << 6) | (chx & 0x3F);
        }
      }
      
      str += String.fromCharCode(ch);
    }
    
    return str;
  }

  initArrayToZeros(arr){
    for(var i = 0; i < arr.length; ++i){
      arr[i] = 0;
    }
  }

  encrypt(clearStr) {
    if(this.hasKey === false){
      console.log("Tea encrypt: does not have a key to encrypt, returning data as it is");
      return clearStr;
    }
    var clear = this.toBytesArray(clearStr);
    var paddedSize = Math.floor( (clear.length / 8) + ( (clear.length % 8) === 0 ? 0 : 1)) * 2;
    var buffer = [];
    buffer.length = paddedSize + 1;
    this.initArrayToZeros(buffer);
		buffer[0] = clear.length;    
		this.pack(clear, buffer, 1);  
  	this.brew(buffer);
    return this.unpack(buffer, 0, buffer.length * 4);
  }
  
  decrypt(crypt) {
    if(this.hasKey === false){
      console.log("Tea decrypt: does not have a key to decrypt, returning data as it is");
      return crypt;
    }

    if(crypt.length % 4 !== 0){
      throw new Error("decrypt: Bad arg");
    }
    if((crypt.length / 4) % 2 !== 1){
      throw new Error("decrypt: Bad arg");
    }
		
    var buffer = [];
    buffer.length = crypt.length / 4;
    this.initArrayToZeros(buffer);
		this.pack(crypt, buffer, 0);
		this.unbrew(buffer);
    var bytes = this.unpack(buffer, 1, buffer[0]);
		return this.toString(bytes);
  }
  
  brew(buf) {
    if(buf.length % 2 !== 1){
      throw new Error("brew: Bad buf length");
    }
		
    var i = 1, v0, v1, sum, n;
    
		while ( i < buf.length) {
			n = this.CUPS;
			v0 = buf[i];
			v1 = buf[i + 1];
			sum = 0;
			while (n-- > 0) {
				sum += this.SUGAR;
				v0  += ((v1 << 4 ) + this.S[0] ^ v1) + (sum ^ (v1 >>> 5)) + this.S[1];
				v1  += ((v0 << 4 ) + this.S[2] ^ v0) + (sum ^ (v0 >>> 5)) + this.S[3];
			}
			buf[i] = v0;
			buf[i+1] = v1;
			i+=2;
    }
  }
  
  unbrew(buf) {
		if(buf.length % 2 !== 1){
      throw new Error("unbrew: Bad buf length");
    }

		var i = 1;
    var v0;
    var v1;
    var sum;
    var n;

		while (i < buf.length) {
			n = this.CUPS;
			v0 = buf[i]; 
			v1 = buf[i+1];
			sum = this.UNSUGAR;
			while (n-- > 0) {
				v1  -= ((v0 << 4 ) + this.S[2] ^ v0) + (sum ^ (v0 >>> 5)) + this.S[3];
				v0  -= ((v1 << 4 ) + this.S[0] ^ v1) + (sum ^ (v1 >>> 5)) + this.S[1];
				sum -= this.SUGAR;
			}
			buf[i] = v0;
			buf[i+1] = v1;
			i+=2;
		}
  }
  
  pack(src, dest, destOffset) {
    if( destOffset + (src.length / 4) > dest.length){
      throw new Error("pack: bad args");
    }
    
		var i = 0, shift = 24;
		var j = destOffset;
    dest[j] = 0;
    
		while (i < src.length) {
			dest[j] |= ((src[i] & 0xff) << shift);
			if (shift == 0) {
				shift = 24;
				j++;
				if (j < dest.length) dest[j] = 0;
			}
			else {
				shift -= 8;
			}
			i++;
		}
  }
  
  unpack(src, srcOffset, destLength) {
		if( destLength > (src.length - srcOffset) * 4){
      throw new Error("unpack: bad args");
    }

		var dest = [];
		var i = srcOffset;
		var count = 0;
		for (var j = 0; j < destLength; j++) {
			dest[j] =  ((src[i] >> (24 - (8 * count))) & 0xff);
			count++;
			if (count == 4) {
				count = 0;
				i++;
			}
		}
		return dest;
	}
}

module.exports = Tea;