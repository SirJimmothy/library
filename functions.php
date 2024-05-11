<?php /** @noinspection PhpUnused */

/**
 * Perform various SQL actions depending on context:
 * * error   Return the last-produced error
 * * connect Create a new database connection
 * * db      Assign an existing connection to database $tbl
 * * status  Determine whether $conn represents a valid database connection
 * * id      Determine whether $tbl qualifies as a table row UID
 * * cleanse Sanitise $tbl to make it suitable for query use
 * * doquery Perform a manual query using $query. Only available when $doquery is TRUE or the call is performed internally
 * * query   Perform an assisted query using only the fields and WHERE options provided
 * * array   Fetch array returned from query
 * * free    If a result set iteration is broken partway through, free up the memory associated with the result set
 * * add     Insert a database row into table $tbl using data in $val
 * * edit    Modify a database row(s) in table $tbl using data in $val, with $query conditions
 * * delete  Delete database row(s) in table $tbl, with $query conditions
 * * select  Select a single database row, with $query conditions. Optionally return only field $val
 * * next    Fetch the next auto-increment ID from table $tbl
 * * last    Fetch the last auto-increment ID generated from insert statements this session
 * * count   Count the number of rows in table $tbl, with $query conditions
 * * rows    Get the number of rows returned from query $tbl
 *
 * @param string                $act   Action to undertake
 * @param ?mysqli_result|string $tbl   Table name to query, aside from `connect` act
 * @param string|null           $val   Value to return, usually a result set's field name
 * @param string|null           $extra Additional query to apply, such as WHERE
 * @param ?mysqli|string        $conn  Database connection to use; defaults to `conf::$db`
 *
 * @return mixed
 */
function do_sql(string $act,string $tbl = NULL,string $val = NULL,string $extra = NULL,$conn = NULL) {
	// Note: $return is reused as often as possible to prevent confusion between variables
	// $conn is not used in the examples below, it should have already been defined according to the constant
	// Where $extra is an integer and not a string, this will be compared against the field
	// after which the table is named, i.e. for the table 'user', the field 'user_id' will be assumed

	$conn = ($conn ?: conf::$db); // Reference the default connection

	// Allow do_sql('doquery') calls outside native calls within this function
	// This is particularly useful for stopping custom queries being run
	// If $doquery is set to FALSE, any do_sql('doquery') calls from outside this function will return FALSE
	$doquery	= TRUE;
	$return		= NULL;

	switch($act) {
		case 'error':

			$return = mysqli_error($conn);

		break;
		case 'connect':

			$conn = (is_string($conn) ? $conn : ''); // $conn is used as database name here; treat accordingly
			$return = mysqli_init();
			mysqli_options($return,MYSQLI_SET_CHARSET_NAME,'utf8');
			mysqli_options($return,MYSQLI_OPT_CONNECT_TIMEOUT,1);
			mysqli_real_connect($return,$tbl,$val,$extra,($conn ?? NULL));

		break;
		case 'db':

			$return = do_sql('doquery','','',"USE `".$tbl."`",$conn);

		break;
		case 'status':

			$return = (bool) $conn;

		break;
		case 'doquery':

			// do_sql('doquery','','',"SELECT * FROM `person` WHERE `person_id` = '2'");

			$return = (debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS,1)[0]['function'] == 'do_sql');
			/** @noinspection PhpConditionAlreadyCheckedInspection */
			if ($doquery || $return) {
				if (!is_array($extra)) {
					$return = mysqli_query($conn,$extra);
				} else {
					$return = [];
					foreach($extra as $arr) {
 						$return[] = mysqli_query($conn,$arr,MYSQLI_USE_RESULT);
					}
				}
			}

		break;
		case 'id':

			// do_sql('id',45); // Determines whether a passed value qualifies as a table row UID

			$return = (is_numeric($tbl) && (int) $tbl == (float) $tbl);

		break;
		case 'cleanse':

			// do_sql('cleanse','Naughty SQL injection string here');

			$return = mysqli_real_escape_string($conn,$tbl);

		break;
		case 'array':

			// do_sql('array',$query);

			$return = ($tbl ? mysqli_fetch_array($tbl,MYSQLI_ASSOC) : []);

		break;
		case 'free':

			// do_sql('free',$result);

			mysqli_free_result($tbl);

		break;
		case 'query':

			// do_sql('query','person','',"WHERE `person_id` = '2'");
			// do_sql('query','person','`forename`,`surname`',2);

			$return = ($val ?: "*");
			$extra = (do_sql('id',$extra) ? "WHERE `".$tbl."_id` = '".$extra."'" : $extra);
			$return = "SELECT ".$return." FROM `".$tbl."`".($extra ? " ".$extra : '');
			$return = do_sql('doquery','','',$return,$conn);

		break;
		case 'add':

			// do_sql('add','person',$sqlstr['add']);

			$return = "INSERT INTO `".$tbl."` VALUES(".$val.")";
			$return = do_sql('doquery','','',$return,$conn);
			$return = ($return === TRUE ?: mysqli_error($conn));

		break;
		case 'edit':

			// do_sql('edit','person',$sqlstr['edit'],2);

			$extra = (do_sql('id',$extra) ? "WHERE `".$tbl."_id` = '".$extra."'" : $extra);
			$return = "UPDATE `".$tbl."` SET ".$val.($extra ? " ".$extra : "");
			$return = do_sql('doquery','','',$return,$conn);
			$return = ($return === TRUE ?: mysqli_error($conn));

		break;
		case 'delete':

			// do_sql('delete','person','',2);

			$extra = (do_sql('id',$extra) ? "WHERE `".$tbl."_id` = '".$extra."'" : $extra);
			$return = "DELETE FROM `".$tbl."`".($extra ? " ".$extra : "");
			$return = do_sql('doquery','','',$return,$conn);
			$return = ($return === TRUE ?: mysqli_error($conn));

		break;
		case 'select':

			// do_sql('select','person','forename',2);
			// do_sql('select','person',"`forename`,`surname`",2);

			$extra = (do_sql('id',$extra) ? "WHERE `".$tbl."_id` = '".$extra."'" : $extra);
			$return = do_sql('query',$tbl,$val,$extra,$conn);
			$return = do_sql('array',$return);
			if ($val && strpos($val,',') === FALSE) { $return = ($return[$val] ?? $return); }

		break;
		case 'next':

			// do_sql('next','person');

			$return = do_sql('doquery','','',"SHOW TABLE STATUS LIKE '".$tbl."'",$conn);
			$return = mysqli_fetch_assoc($return);
			$return = $return['Auto_increment'];

		break;
		case 'last':

			// do_sql('last'); // Determines the ID of the last inserted row in this session

			$return = mysqli_insert_id($conn);

		break;
		case 'count':

			// do_sql('count','person','',"WHERE `forename` = 'John'");

			$query = ($tbl ? "SELECT * FROM `".$tbl."`" : "").($tbl && $extra ? " " : "").$extra;
			$return = do_sql('doquery','','',"SELECT COUNT(*) as `count` FROM (".$query.") as `tCount`",$conn);
			if ($return = do_sql('array',$return)) { // Attempt fast count
				$return = $return['count'];
			} elseif ($return = do_sql('doquery','','',$query)) { // If fast count fails, attempt slow count
				$return = mysqli_num_rows($return);
			} else { // If all else fails, just give up
				$return = 0;
			}

		break;
		case 'rows':

			// do_sql('rows',$query);
			$return = ($tbl ? mysqli_num_rows($tbl) : 0);

		break;
	}
	return $return;
}

/**
 * Perform variable replacement on $content using the associative array $data
 * If $separator is specified, treat the input string as a series of fields, exploded by $separator
 * e.g. with space as separator, 'str1 str2 str3' becomes '{{str1}} {{str2}} {{str3}}'
 *
 * @param string $content
 * @param array  $data
 * @param string $separator
 * @param string $left
 * @param string $right
 *
 * @return string
 */
function interpret(string $content,array $data,string $separator = '',string $left = '{{', string $right = '}}'): string {
	$orig = '';
	if ($separator) {
		$orig = $content = explode($separator,$content);
		foreach($content as $key => $arr) { $content[$key] = $left.strtoupper($arr).$right; }
		$content = implode($separator,$content);
	}

	preg_match_all("|(".$left.")(.*)(".$right.")|U",$content,$match);
	for ($i = 0, $max = count($match[0]); $i < $max; $i++) {
		$key = strtolower(str_replace(['{','}'],'',$match[0][$i]));
		$data[$key] = ($data[$key] ?? ($separator ? $orig[$i] : ''));
		$content = str_replace($match[0][$i],$data[$key],$content);
	}
	return $content;
	// <img src="/img/logo.png" />
}

/**
 * Redirect the request to a new URL, with optional HTTP response code
 *
 * @param string $url
 * @param int    $code
 */
function redir(string $url,int $code = 0): void {
	header('Location: '.$url,TRUE,($code ?? 302));
	exit; // Avoid conflicts with other header commands
}

/**
 * Set or retrieve data from the current browsing session
 *
 * @param string  $act
 * @param ?string $name
 * @param ?string $value
 *
 * @return ?string
 */
function site_session(string $act,?string $name = NULL,?string $value = NULL): ?string {
	session_start();
	$return = NULL;
	switch ($act) {
		case 'set':		$_SESSION[$name] = $value; break;
		case 'get':		$return = ($_SESSION[$name] ?? NULL); break;
	}
	session_write_close();
	return $return;
}

/**
 * Generate HTML tags
 *
 * Examples:
 *
 * `tag('div','|body','Body tag here')`
 * ```
 * <div id="body">Body tag here</div>
 * ```

 * `tag('text','username¦plc=Username Here','Jimmothy')`
 *
 * ```
 * <input type="text" name="username" placeholder="Username here" value="Jimmothy" />
 * ```

 * `tag('select','dropdown',[['opt1','Option 1'],['opt2','Option 2',1]])`
 *
 * ```
 * <select name="dropdown"><option value="opt1">Option 1</option><option value="opt2" selected="selected">Option 2</option></select>
 * ```
 *
 * @param string       $tag
 * @param string       $attribs
 * @param array|string $content
 *
 * @return string
 */
function tag(string $tag,string $attribs = '',$content = ''): string {
	// Split attribute sets into standard vs custom
	$attribs = array_pad(explode('¦',$attribs),2,'');
	foreach($attribs as $key => $arr) {
		$attribs[$key] = explode('|',$arr);
	}

	// Process standard attributes that can apply to all tags
	$atr = [];
	foreach($attribs[0] as $key => $arr) {
		if ($arr == '') { continue; }

		$arg = '';
		switch ($key) {
			case 0:	$arg = 'name';	break;
			case 1:	$arg = 'id';		break;
			case 2:	$arg = 'class';	break;
			case 3:	$arg = 'style';	break;
			case 4:	$arg = 'title';	break;
		}
		if ($arg) { $atr[] = $arg.'="'.$arr.'"'; }
	}

	// Process custom attributes
	foreach($attribs[1] as $arr) {
		if ($arr == '') { continue; }

		$arr = array_pad(explode('=',$arr),2,'');
		switch ($arr[0]) {
			// Attributes that don't require custom values
			case 'afo':	$atr[] = 'autofocus="autofocus"';					break;
			case 'chk':	$atr[] = 'checked="checked"';							break;
			case 'dis':	$atr[] = 'disabled="disabled"';						break;
			case 'enc':	$atr[] = 'enctype="multipart/form-data"';	break;
			case 'req':	$atr[] = 'required="required"';						break;
			case 'sel':	$atr[] = 'selected="selected"';						break;

			// Attributes that contain custom values
			case 'csp':	$atr[] = 'colspan="'.$arr[1].'"';					break;
			case 'rsp':	$atr[] = 'rowspan="'.$arr[1].'"';					break;
			case 'plc':	$atr[] = 'placeholder="'.$arr[1].'"';			break;
			case 'tar':	$atr[] = 'target="'.$arr[1].'"';					break;
			case 'ttl':	$atr[] = 'title="'.$arr[1].'"';						break;
			case 'val':	$atr[] = 'value="'.$arr[1].'"';						break;

			// Tags where the shorthand is the full attribute name
			// We don't have to specify these tags here, as default will handle it,
			// but for the sake of reference, keep these visible
			case 'alt':	case 'href':	case 'src':
			default:
				$atr[] = implode('=',$arr);
			break;
		}
	}
	$atr = ($atr ? ' '.implode(' ',$atr) : '');

	switch ($tag) {
		case 'hidden':	case 'text':	case 'password':	case 'email':			case 'url':		case 'search':
		case 'submit':	case 'reset':	case 'image':			case 'checkbox':	case 'radio':	case 'file':
 		case 'date':		case 'time':	case 'number':		case 'color':			case 'range':
			$return = '<input type="'.$tag.'"'.$atr.' value="'.$content.'" />';
		break;
		case 'area':	case 'br':	case 'hr':	case 'source':
			$return = '<'.$tag.$atr.' />';
		break;
		case 'select':

			/* For selects, presume $content is an array of arrays in this format:
			 * [(string) value,(string) Caption,(truthy) selected],
			 */
			$content = (array) $content;
			foreach($content as $key => $arr) {
				if (!$arr) { continue; }

				$arr = array_pad($arr,3,'');
				$content[$key] = tag('option','¦val='.$arr[0].($arr[2] ? '|sel' : ''),$arr[1]);
			}
			$return = '<'.$tag.$atr.'>'.implode('',$content).'</'.$tag.'>';

		break;
		// Again, we don't have to specify these tags here, as default will handle it,
		// but for the sake of reference, keep these visible
		case 'a':			case 'audio':			case 'button':	case 'form':	case 'iframe':	case 'img':
		case 'label':	case 'optgroup':	case 'option':	case 'pre':		case 'script':	case 'textarea':
		case 'video':
		default:
			$return = '<'.$tag.$atr.'>'.$content.'</'.$tag.'>';
		break;
	}

	return $return;
}

?>